import {
  Client,
  Colors,
  Guild,
  PermissionFlagsBits,
  ButtonStyle,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
} from "discord.js";
import { GuildCreateEvent } from "@/@types/Util";
import config from "@/config";

class AddEvent implements GuildCreateEvent {
  public readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(guild: Guild): Promise<void> {
    let find = 0;

    guild.channels.cache.map((channel) => {
      if (find === 0) {
        if (
          guild.members.me &&
          channel.type === ChannelType.GuildText &&
          guild.members.me.permissionsIn(channel).has(PermissionFlagsBits.ViewChannel) &&
          guild.members.me.permissionsIn(channel).has(PermissionFlagsBits.SendMessages)
        ) {
          channel
            .send({
              embeds: [
                {
                  color: Colors.Green,
                  thumbnail: {
                    url: config.image.botIcon,
                  },
                  title: "BOT導入ありがとうございます!",
                  description:
                    "やっほー。TakasumiBOTだよ\n便利な機能を備えた万能BOTです\n\nグローバルチャット、サーバー掲示板、認証機能などいろいろあるよ!\nコマンドのhelpを表示する時は`/help`を実行してね\n`/follow`を実行するとBOTのアナウンスチャンネルが追加できます",
                },
              ],
              components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                  new ButtonBuilder()
                    .setLabel("サポートサーバー")
                    .setURL(config.inviteUrl)
                    .setStyle(ButtonStyle.Link),
                ),
              ],
            })
            .catch(() => {});

          return (find = 1);
        }
      }
    });
  }
}

export default AddEvent;
