import { FC, FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import {
  parse,
  typecheckProject,
  errorInfoToString,
  compileProject,
  UntypedProject,
} from "kestrel-lang/dist";
import { core, externs } from "./core";
import Convert from "ansi-to-html";
import IOExtern from "./IO.extern?raw";

type Result<T, E> = { type: "OK"; value: T } | { type: "ERR"; error: E };

const getCompileResult = (main: string): Result<string, JSX.Element> => {
  const parsed = parse(main);

  if (!parsed.ok) {
    const error = (
      <div>
        <b>Parsing error:</b>
        <br />
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {parsed.matchResult.message}
        </pre>
      </div>
    );

    return { type: "ERR", error };
  }

  const raw: UntypedProject = {
    Main: { package: "", module: parsed.value },
    ...core,
  };

  const project = typecheckProject(raw);

  const [, errors] = project.Main;

  if (errors.length !== 0) {
    const convert = new Convert();

    const error = (
      <div>
        {errors.map((err, index) => {
          const msg = errorInfoToString(main, err);
          return (
            <pre
              style={{ whiteSpace: "pre-wrap" }}
              key={index}
              dangerouslySetInnerHTML={{ __html: convert.toHtml(msg) }}
            />
          );
        })}
      </div>
    );

    return { type: "ERR", error: error };
  }

  const typedProject = Object.fromEntries(
    Object.entries(project).map(([k, [m]]) => [k, m])
  );

  try {
    const compiled = compileProject(typedProject, {
      externs: {
        IO: IOExtern,
        ...externs,
      },
    });

    // HACK!
    const replaced = compiled.replace(
      "Main$main.exec()",
      `Main$main.exec(() => {
  postMessage({ type: "exit" });
})`
    );

    const blob = new Blob([replaced], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    return { type: "OK", value: url };
  } catch (err) {
    const error = (
      <div>
        <b>Compilation error:</b>
        <br />
        <pre style={{ whiteSpace: "pre-wrap" }}>{(err as Error).message}</pre>
      </div>
    );

    return { type: "ERR", error };
  }
};

const IO: FC<{ type: string; children?: ReactNode }> = ({ type, children }) => (
  <span>
    <pre style={{ display: "inline", color: "#a2a2a2" }}>[{type}]</pre>{" "}
    {children}
  </span>
);

const Print: FC<{ value: string }> = ({ value }) => (
  <IO type="print">{value}</IO>
);

const Readline: FC<{
  onResolve: (value: string) => void;
  abortSignal: AbortSignal;
}> = ({ onResolve, abortSignal }) => {
  const [value, setValue] = useState("");
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function onCancel() {
      setDisabled(true);
    }
    abortSignal.addEventListener("abort", onCancel);
    return () => abortSignal.removeEventListener("abort", onCancel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(evt: FormEvent) {
    evt.preventDefault();
    onResolve(value);
    setDisabled(true);
  }

  return (
    <IO type="readline">
      <form style={{ display: "inline" }} onSubmit={handleSubmit}>
        <input
          type="text"
          disabled={disabled}
          autoFocus
          value={value}
          onInput={(e) => setValue(e.currentTarget.value)}
        />
      </form>
    </IO>
  );
};

export const Runner: FC<{ workerUrl: string; main: string }> = ({
  workerUrl,
  main,
}) => {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<JSX.Element[]>([]);
  const currentWorker = useRef<Worker | undefined>();

  function reset() {
    currentWorker.current?.terminate();
    setRunning(false);
    setLogs([]);
  }

  useEffect(() => {
    reset();
  }, [main]);

  // eslint-disable-next-line no-inner-declarations
  function run() {
    reset();

    setRunning(true);
    const w = new Worker(workerUrl);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    w.addEventListener("message", (msg: any) => {
      switch (msg.data.type) {
        case "IO:println":
          setLogs((logs) => [...logs, <Print value={msg.data.value} />]);
          break;

        case "IO:readline": {
          const id = msg.data.id;
          const abortController = new AbortController();

          w.addEventListener("message", (msg) => {
            if (msg.data.type === "IO:readline:cancel" && msg.data.id === id) {
              abortController.abort();
            }
          });

          setLogs((logs) => [
            ...logs,
            <Readline
              key={id}
              abortSignal={abortController.signal}
              onResolve={(value) => {
                w.postMessage({
                  type: "IO:readline:resolve",
                  id: id,
                  value,
                });
              }}
            />,
          ]);
          break;
        }

        case "exit":
          setRunning(false);
          setLogs((logs) => [...logs, <IO type="exit" />]);
          break;

        default:
          break;
      }
    });

    currentWorker.current = w;
  }

  return (
    <div>
      {running ? (
        <button
          onClick={() => {
            currentWorker.current?.terminate();
            setRunning(false);
          }}
        >
          Stop
        </button>
      ) : (
        <button onClick={run}>Run program</button>
      )}
      <br />
      {logs.length === 0 ? null : <h4>IO:</h4>}
      <ul>
        {logs.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
    </div>
  );
};

export const Output: FC<{ main: string }> = ({ main }) => {
  const res = getCompileResult(main);

  switch (res.type) {
    case "OK":
      return <Runner workerUrl={res.value} main={main} />;
    case "ERR":
      return res.error;
  }
};
