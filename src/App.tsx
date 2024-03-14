import { FC, useState } from "react";
import Editor from "@monaco-editor/react";
import { Output } from "./Output";
import styles from "./App.module.css";

const DEFAULT_INPUT = `import IO
import Task.{await}

pub let main = {
  let#await _ = IO.println("What is your name?");
  let#await name = IO.readline;
  let#await _unit = IO.println("Nice to meet you, " <> name);
  Task.none
}
`;

export const App: FC = () => {
  const [main, setMain] = useState(DEFAULT_INPUT);

  return (
    <div className={styles.splitPane}>
      <div className={styles.editor}>
        <Editor
          height="100vh"
          defaultValue={DEFAULT_INPUT}
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
  );
};
