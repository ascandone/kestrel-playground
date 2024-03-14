import Async from "../kestrel_core/src/Async.kes?raw";
import Basics from "../kestrel_core/src/Basics.kes?raw";
import BasicsExtern from "../kestrel_core/src/Basics.js?raw";
import List from "../kestrel_core/src/List.kes?raw";
import Maybe from "../kestrel_core/src/Maybe.kes?raw";
import MVar from "../kestrel_core/src/MVar.kes?raw";
import MVarExtern from "../kestrel_core/src/MVar.js?raw";
import Result from "../kestrel_core/src/Result.kes?raw";
import String from "../kestrel_core/src/String.kes?raw";
import StringExtern from "../kestrel_core/src/String.js?raw";
import Task from "../kestrel_core/src/Task.kes?raw";
import TaskExtern from "../kestrel_core/src/Task.js?raw";
import Tuple from "../kestrel_core/src/Tuple.kes?raw";

import IO from "../kestrel_core/src/IO.kes?raw";

import { unsafeParse, UntypedModule } from "kestrel-lang";

const raw = {
  Async,
  Basics,
  List,
  Maybe,
  MVar,
  Result,
  String,
  Task,
  Tuple,

  IO,
};

export const externs = {
  Basics: BasicsExtern,
  Task: TaskExtern,
  String: StringExtern,
  MVar: MVarExtern,
};

function getRaw(): Record<string, UntypedModule> {
  const parsed = Object.entries(raw).map(([k, v]) => [k, unsafeParse(v)]);
  return Object.fromEntries(parsed);
}

export const core = getRaw();
