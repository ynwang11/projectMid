#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import random
from pathlib import Path

FILE_MAP = {
    1: "./mini-csv/txts/mid.txt",
    2: "./mini-csv/txts/positive.txt",
    3: "./mini-csv/txts/negative.txt",
    4: "./mini-csv/txts/thinking.txt"
}

def read_lines(path: Path) -> list[str]:
    if not path.exists():
        return []
    with path.open(encoding="utf-8") as f:
        return [line.rstrip("\n") for line in f if line.strip()]

def main() -> None:
    while True:
        try:
            code = int(input("请输入 0-7 的数字（Ctrl+C 退出）：").strip())
            if not 0 <= code <= 7:
                raise ValueError
            break
        except ValueError:
            print("输入不合法，重新输入！")

    if code not in FILE_MAP:
        print("此状态未定义，后期解决")
        return

    lines = read_lines(Path(FILE_MAP[code]))
    if not lines:
        print(f"{FILE_MAP[code]} 不存在或为空！")
        return

    print(random.choice(lines))

if __name__ == "__main__":
    main()
