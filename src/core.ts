import Async from "../kestrel_core/src/Async.kes?raw";
import Bool from "../kestrel_core/src/Bool.kes?raw";
import BoolExtern from "../kestrel_core/src/Bool.js?raw";
import Char from "../kestrel_core/src/Char.kes?raw";
import CharExtern from "../kestrel_core/src/Char.js?raw";
import Debug from "../kestrel_core/src/Debug.kes?raw";
import DebugExtern from "../kestrel_core/src/Debug.js?raw";
import Float from "../kestrel_core/src/Float.kes?raw";
import Int from "../kestrel_core/src/Int.kes?raw";
import List from "../kestrel_core/src/List.kes?raw";
import MVar from "../kestrel_core/src/MVar.kes?raw";
import MVarExtern from "../kestrel_core/src/MVar.js?raw";
import Option from "../kestrel_core/src/Option.kes?raw";
import Result from "../kestrel_core/src/Result.kes?raw";
import String from "../kestrel_core/src/String.kes?raw";
import StringExtern from "../kestrel_core/src/String.js?raw";
import Task from "../kestrel_core/src/Task.kes?raw";
import TaskExtern from "../kestrel_core/src/Task.js?raw";
import Time from "../kestrel_core/src/Time.kes?raw";
import Tuple from "../kestrel_core/src/Tuple.kes?raw";

import IO from "../kestrel_core/src/IO.kes?raw";

import { unsafeParse, UntypedProject } from "kestrel-lang";

const raw = {
  Async,
  Bool,
  Char,
  Debug,
  Float,
  Int,
  List,
  MVar,
  Option,
  Result,
  String,
  Task,
  Time,
  Tuple,

  IO,
};

export const externs = {
  Bool: BoolExtern,
  Char: CharExtern,
  Debug: DebugExtern,
  MVar: MVarExtern,
  String: StringExtern,
  Task: TaskExtern,
};

function getRaw(): UntypedProject {
  const parsed = Object.entries(raw).map(([k, v]) => [
    k,
    {
      package: "kestrel_core",
      module: unsafeParse(v),
    },
  ]);
  return Object.fromEntries(parsed);
}

export const core = getRaw();
