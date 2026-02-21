export default (namespace: string = "") => {
  const prefix = namespace.length ? `[${namespace}] ` : "";
  return {
    log: (...messages: unknown[]) =>
      console.log(`${prefix}${messages.join(" ")}`),
  };
};
