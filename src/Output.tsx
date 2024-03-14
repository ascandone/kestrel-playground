import { FC, FormEvent, useEffect, useState } from "react";
import {
  parse,
  typecheckProject,
  errorInfoToString,
  compileProject,
} from "kestrel-lang/dist";
import { core, externs } from "./core";
import Convert from "ansi-to-html";
import IOExtern from "./IO.extern?raw";

type Result<T, E> = { type: "OK"; value: T } | { type: "ERR"; error: E };

const getCompileResult = (main: string): Result<VoidFunction, JSX.Element> => {
  const parsed = parse(main);

  if (!parsed.ok) {
    const error = (
      <div style={{ padding: "2rem" }}>
        <b>Parsing error:</b>
        <br />
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {parsed.matchResult.message}
        </pre>
      </div>
    );

    return { type: "ERR", error };
  }

  const raw = {
    Main: parsed.value,
    ...core,
  };

  const project = typecheckProject(raw);

  const [, errors] = project.Main;

  if (errors.length !== 0) {
    const convert = new Convert();

    const error = (
      <div style={{ padding: "2rem" }}>
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

    const run = new Function(compiled);

    return { type: "OK", value: () => run() };
  } catch (err) {
    const error = (
      <div style={{ padding: "2rem" }}>
        <b>Compilation error:</b>
        <br />
        <pre style={{ whiteSpace: "pre-wrap" }}>{(err as Error).message}</pre>
      </div>
    );

    return { type: "ERR", error };
  }
};

const Print: FC<{ value: string }> = ({ value }) => (
  <span>
    <pre style={{ display: "inline" }}>[log]</pre> {value}
  </span>
);

const Readline: FC = () => {
  const [value, setValue] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(evt: FormEvent) {
    evt.preventDefault();

    document.dispatchEvent(
      new CustomEvent("IO:readline:resolve", { detail: { value } })
    );

    setSent(true);
  }

  return (
    <span>
      <pre style={{ display: "inline" }}>[readline]</pre>{" "}
      <form style={{ display: "inline" }} onSubmit={handleSubmit}>
        <input
          type="text"
          disabled={sent}
          autoFocus
          value={value}
          onInput={(e) => setValue(e.currentTarget.value)}
        />
      </form>
    </span>
  );
};

export const Runner: FC<{ run: VoidFunction }> = ({ run }) => {
  const [logs, setLogs] = useState<JSX.Element[]>([]);

  useEffect(() => {
    function onPrintln(e: Event) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value = (e as any).detail.value;
      setLogs((logs) => [...logs, <Print value={value} />]);
    }
    document.addEventListener("IO:println", onPrintln);

    function onReadline() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any

      setLogs((logs) => [...logs, <Readline key={Math.random()} />]);
    }
    document.addEventListener("IO:readline", onReadline);

    return () => {
      document.removeEventListener("IO:println", onPrintln);
      document.removeEventListener("IO:readline", onReadline);
    };
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <p>No errors found ✅</p>
      <button
        onClick={() => {
          setLogs([]);
          run();
        }}
      >
        Run
      </button>
      <hr />
      Logs:
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
      return <Runner run={res.value} key={main} />;
    case "ERR":
      return res.error;
  }
};
