import { FC, useEffect, useState } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { Output } from "./Output";
import styles from "./App.module.css";
import CONCURRENCY_EXAMPLE from "./examples/ConcurrencyExample.kes?raw";
import LIST_EXAMPLE from "./examples/ListExample.kes?raw";
import IO_EXAMPLE from "./examples/IOExample.kes?raw";
import FIBONACCI_EXAMPLE from "./examples/FibonacciExample.kes?raw";

type ExampleId = "io" | "fibonacci" | "concurrency" | "list";

function getExample(exampleId: ExampleId): string {
  switch (exampleId) {
    case "io":
      return IO_EXAMPLE;
    case "fibonacci":
      return FIBONACCI_EXAMPLE;
    case "concurrency":
      return CONCURRENCY_EXAMPLE;
    case "list":
      return LIST_EXAMPLE;
  }
}

const ExampleSelect: FC<{
  id: ExampleId;
  onChange: (id: ExampleId) => void;
}> = ({ id, onChange }) => {
  return (
    <select
      style={{ margin: "0.2rem 0.1rem" }}
      value={id}
      onChange={(e) => onChange(e.target.value as ExampleId)}
    >
      <option value="list">Lists</option>
      <option value="fibonacci">Fibonacci</option>
      <option value="io">IO</option>
      <option value="concurrency">Concurrency</option>
    </select>
  );
};

export const App: FC = () => {
  const [id, setId] = useState<ExampleId>("fibonacci");
  const [main, setMain] = useState(() => getExample(id));
  const monaco = useMonaco();
  useEffect(() => {
    const main = getExample(id);
    setMain(main);
    if (monaco) {
      const [editor] = monaco.editor.getEditors();
      editor.setValue(main);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <>
      <div>
        <ExampleSelect id={id} onChange={setId} />
      </div>

      <div className={styles.splitPane}>
        <div className={styles.editor}>
          <Editor
            height="100vh"
            defaultValue={main}
            theme="vs-dark"
            onChange={(value) => {
              if (value === undefined) {
                return;
              }
              setMain(value);
            }}
            options={{
              minimap: { enabled: false },
              scrollbar: { vertical: "hidden" },
            }}
          />
        </div>
        <div className={styles.output}>
          <Output main={main} />
        </div>
      </div>
    </>
  );
};
