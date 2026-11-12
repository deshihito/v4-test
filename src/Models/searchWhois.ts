import net from "net";

const searchWhois = async (host: string, domain: string): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    let data = "";

    const socket = net.connect(
      {
        host: host,
        port: 43,
      },
      () => socket.write(`${domain}\r\n`),
    );

    socket.setTimeout(1000);
    socket.on("data", (chunk) => (data += chunk));
    socket.on("close", () => resolve(data));
    socket.on("error", (error) => reject(error));
    socket.on("timeout", () => {
      socket.destroy();
      reject();
    });
  });
};

export default searchWhois;
