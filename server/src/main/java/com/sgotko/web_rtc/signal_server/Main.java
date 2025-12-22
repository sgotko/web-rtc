package com.sgotko.web_rtc.signal_server;

import picocli.CommandLine;

public class Main {

	public static void main(String[] args) {
		int exitCode = new CommandLine(new WebSocketCommand()).execute(args);
		System.exit(exitCode);
	}

}
