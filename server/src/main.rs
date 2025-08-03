use axum::{
    extract::{ws::WebSocketUpgrade, Query, State},
    response::Response,
    routing::get,
    Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use uuid::Uuid;

type RoomMap = Arc<Mutex<HashMap<String, Vec<WebSocketUser>>>>;

struct WebSocketUser {
    user_id: String,
    sender: tokio::sync::mpsc::UnboundedSender<String>,
}

#[derive(Deserialize)]
struct WsQuery {
    room: String,
    user: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
struct SignalMessage {
    #[serde(rename = "type")]
    r#type: String,
    sender: String,
    data: Option<serde_json::Value>,
}

#[tokio::main]
async fn main() {
    let room_map = Arc::new(Mutex::new(HashMap::new()));

    let app = Router::new()
        .route("/ws", get(ws_handler))
        .with_state(room_map);

    println!("🚀 Сигнальный сервер запущен на ws://127.0.0.1:3000/ws");
    axum::Server::bind(&"127.0.0.1:3000".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}

async fn ws_handler(
    ws: WebSocketUpgrade,
    Query(query): Query<WsQuery>,
    State(room_map): State<RoomMap>,
) -> Response {
    let user_id = query.user.unwrap_or_else(|| Uuid::new_v4().to_string());
    let room_id = query.room;

    ws.on_upgrade(move |socket| handle_socket(socket, room_map, room_id, user_id))
}

async fn handle_socket(
    mut socket: axum::extract::ws::WebSocket,
    room_map: RoomMap,
    room_id: String,
    user_id: String,
) {
    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel::<String>();

    {
        let mut rooms = room_map.lock().await;
        let room = rooms.entry(room_id.clone()).or_insert_with(Vec::new);
        room.push(WebSocketUser {
            user_id: user_id.clone(),
            sender: tx,
        });
    }

    let _ = broadcast(
        &room_map,
        &room_id,
        &user_id,
        SignalMessage {
            r#type: "join".to_string(),
            sender: user_id.clone(),
            data: None,
        },
    )
    .await;

    loop {
        tokio::select! {
            msg = socket.recv() => {
                match msg {
                    Some(Ok(axum::extract::ws::Message::Text(text))) => {
                        match serde_json::from_str::<SignalMessage>(&text) {
                            Ok(mut signal) => {
                                signal.sender = user_id.clone();
                                let _ = broadcast(&room_map, &room_id, &user_id, signal).await;
                            }
                            Err(e) => eprintln!("❌ Ошибка парсинга: {}", e),
                        }
                    }
                    Some(Ok(axum::extract::ws::Message::Close(_))) | None => break,
                    _ => continue,
                }
            }

            text = rx.recv() => {
                match text {
                    Some(text) => {
                        if socket.send(axum::extract::ws::Message::Text(text)).await.is_err() {
                            break;
                        }
                    }
                    None => break,
                }
            }
        }
    }

    {
        let mut rooms = room_map.lock().await;
        if let Some(room) = rooms.get_mut(&room_id) {
            room.retain(|u| u.user_id != user_id);
            if room.is_empty() {
                rooms.remove(&room_id);
            }
        }
    }

    let _ = broadcast(
        &room_map,
        &room_id,
        "",
        SignalMessage {
            r#type: "leave".to_string(),
            sender: user_id,
            data: None,
        },
    )
    .await;
}

async fn broadcast(
    room_map: &RoomMap,
    room_id: &str,
    sender_id: &str,
    msg: SignalMessage,
) -> Result<(), ()> {
    let rooms = room_map.lock().await;
    if let Some(room) = rooms.get(room_id) {
        let text = serde_json::to_string(&msg).map_err(|_| ())?;
        for user in room {
            if user.user_id != sender_id {
                let _ = user.sender.send(text.clone());
            }
        }
    }
    Ok(())
}
