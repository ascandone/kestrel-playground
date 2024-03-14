import { FC, FormEvent, ReactNode, useEffect, useRef, useState } from "react";
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

type MainTask = () => VoidFunction;
const getCompileResult = (main: string): Result<MainTask, JSX.Element> => {
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

  const raw = {
    Main: parsed.value,
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
    // HACK!
    const executor = "Main$main.exec()";
    const compiled = compileProject(typedProject, {
      externs: {
        IO: IOExtern,
        ...externs,
      },
      // Hack!
    }).replace(executor, `return ${executor};`);

    const run = new Function(compiled) as MainTask;
    return { type: "OK", value: run };
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

const IO: FC<{ type: string; children: ReactNode }> = ({ type, children }) => (
  <span>
    <pre style={{ display: "inline", color: "#a2a2a2" }}>[{type}]</pre>{" "}
    {children}
  </span>
);

const Print: FC<{ value: string }> = ({ value }) => (
  <IO type="print">{value}</IO>
);

const Readline: FC<{ id: number }> = ({ id }) => {
  const [value, setValue] = useState("");
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function onCancel(e: any) {
      if (e.detail.id !== id) {
        return;
      }
      setDisabled(true);
    }
    document.addEventListener("IO:readline:cancel", onCancel);
    return () => document.removeEventListener("IO:readline:cancel", onCancel);
  }, []);

  function handleSubmit(evt: FormEvent) {
    evt.preventDefault();

    document.dispatchEvent(
      new CustomEvent("IO:readline:resolve", { detail: { value, id } })
    );

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

export const Runner: FC<{ run: MainTask; main: string }> = ({ run, main }) => {
  const [logs, setLogs] = useState<JSX.Element[]>([]);
  const cancelRef = useRef<VoidFunction | undefined>();

  useEffect(() => {
    cancelRef.current?.();
    setLogs([]);
  }, [main]);

  useEffect(() => {
    function onPrintln(e: Event) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { value } = (e as any).detail;
      setLogs((logs) => [...logs, <Print value={value} />]);
    }
    document.addEventListener("IO:println", onPrintln);

    function onReadline(e: Event) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { id } = (e as any).detail;
      setLogs((logs) => [...logs, <Readline key={id} id={id} />]);
    }

    document.addEventListener("IO:readline", onReadline);

    return () => {
      document.removeEventListener("IO:println", onPrintln);
      document.removeEventListener("IO:readline", onReadline);
    };
  }, []);

  return (
    <div>
      <button
        onClick={() => {
          cancelRef.current?.();
          setLogs([]);
          const cancel = run();
          cancelRef.current = cancel;
        }}
      >
        Run program
      </button>
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
      return <Runner run={res.value} main={main} />;
    case "ERR":
      return res.error;
  }
};
