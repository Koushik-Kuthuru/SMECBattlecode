export type LangConfig = {
  image: string;                 // docker image
  compile?: string;              // compile command inside container
  run: string;                   // run command inside container
  sourceName: string;            // filename to write
};

export const LANGUAGES: Record<string, LangConfig> = {
  python: {
    image: "python:3.11-alpine",
    run: "python3 /work/Main.py",
    sourceName: "Main.py"
  },
  node: {
    image: "node:20-alpine",
    run: "node /work/Main.js",
    sourceName: "Main.js"
  },
  cpp: {
    image: "gcc:13.2.0",
    compile: "bash -lc 'g++ -std=c++17 -O2 -pipe -s /work/Main.cpp -o /work/a.out'",
    run: "/work/a.out",
    sourceName: "Main.cpp"
  },
  java: {
    image: "eclipse-temurin:17-jdk",
    compile: "bash -lc 'javac /work/Main.java'",
    run: "bash -lc 'cd /work && java Main'",
    sourceName: "Main.java"
  }
};
