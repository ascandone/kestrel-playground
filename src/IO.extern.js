function IO$println(value) {
  return new Task$Task((resolve) => {
    postMessage({ type: "IO:println", value });
    resolve(null);
  });
}

const IO$print = IO$println;

function IO$exit(code) {
  return new Task$Task(() => {
    throw new Error("EXIT");
  });
}

const IO$readline = new Task$Task((resolve) => {
  const id = Math.ceil(Math.random() * 10e9);
  postMessage({ type: "IO:readline", id });

  function onResolve(msg) {
    if (msg.data.type === "IO:readline:resolve" && msg.data.id === id) {
      resolve(msg.data.value);
    }
  }

  self.addEventListener("message", onResolve);

  return () => {
    postMessage({ type: "IO:readline:cancel", id });
    self.removeEventListener("message", onResolve);
  };
});
