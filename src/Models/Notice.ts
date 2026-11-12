import { Colors } from "discord.js";
import Log from "@/util/Log";
import config from "@/config";
import { env } from "@/util/Env";

class Notice {
  public static async sendData(option: object): Promise<void> {
    if (!env.NOTICE_WEBHOOK) return Log.error("Notice Webhook URLが設定されていません");

    try {
      await fetch(env.NOTICE_WEBHOOK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(option),
      });
    } catch (error) {
      Log.error(`Webhook通知が送信できませんでした: ${error}`);
    }
  }

  public static async sendInfo(title: string, message?: string): Promise<void> {
    await this.sendData({
      username: "システム情報",
      avatar_url: config.image.successIcon,
      embeds: [
        {
          color: Colors.Green,
          title: title,
          description: message,
        },
      ],
    });
  }

  public static async sendWarn(title: string, message?: string): Promise<void> {
    await this.sendData({
      username: "システム通知",
      avatar_url: config.image.warnIcon,
      embeds: [
        {
          color: Colors.Yellow,
          title: title,
          description: message,
        },
      ],
    });
  }

  public static async sendError(title: string, message?: string): Promise<void> {
    await this.sendData({
      username: "システム警告",
      avatar_url: config.image.errorIcon,
      embeds: [
        {
          color: Colors.Red,
          title: title,
          description: message,
        },
      ],
    });
  }
}

export default Notice;
