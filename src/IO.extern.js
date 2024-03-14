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
  document.dispatchEvent(new CustomEvent("IO:readline"));
  function onResolve(evt) {
    resolve(evt.detail.value);
  }
  document.addEventListener("IO:readline:resolve", onResolve);
  return () => {
    document.removeEventListener("IO:readline:resolve", onResolve);
  };
});
