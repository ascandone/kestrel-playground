function IO$println(value) {
  return new Task$Task((resolve) => {
    const evt = new CustomEvent("IO:println", { detail: { value } });
    document.dispatchEvent(evt);
    resolve(null);
  });
}

function IO$print(value) {
  return new Task$Task((resolve) => {
    const evt = new CustomEvent("IO:println", { detail: { value } });
    document.dispatchEvent(evt);
    resolve(null);
  });
}

function IO$exit(code) {
  return new Task$Task(() => {
    throw new Error("EXIT");
  });
}

const IO$readline = new Task$Task((resolve) => {
  const id = Math.ceil(Math.random() * 10e9);
  document.dispatchEvent(new CustomEvent("IO:readline", { detail: { id } }));
  function onResolve(evt) {
    if (evt.detail.id === id) {
      resolve(evt.detail.value);
    }
  }
  document.addEventListener("IO:readline:resolve", onResolve);
  return () => {
    document.removeEventListener("IO:readline:resolve", onResolve);
    document.dispatchEvent(
      new CustomEvent("IO:readline:cancel", { detail: { id } })
    );
  };
});
