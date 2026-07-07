import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const lockPath = join(".next", "dev", "lock");

function readPidFromLock() {
  if (!existsSync(lockPath)) return null;
  try {
    const raw = readFileSync(lockPath, "utf8").trim();
    const pid = Number(raw);
    return Number.isFinite(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

function killPid(pid) {
  if (process.platform === "win32") {
    execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
    return;
  }
  process.kill(pid, "SIGTERM");
}

const pid = readPidFromLock();
if (pid) {
  try {
    killPid(pid);
    console.log(`Stopped existing Next.js dev server (PID ${pid}).`);
  } catch {
    console.log(`Could not stop PID ${pid}; lock may be stale.`);
  }
} else {
  console.log("No Next.js dev lock file found.");
}
