import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  Colors,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  Message,
  MessageFlags,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";

class DelCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "manage";
  public readonly name: string = "del";
  public readonly description: string = "メッセージを一括で削除します";
  public readonly note: string = "2週間以上前のメッセージは削除できません";
  public readonly example: string[] = ["/del 10", "/del 20 @User"];

  public readonly userPermission: bigint[] = [PermissionFlagsBits.ManageMessages];

  public readonly botPermission: bigint[] = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.ManageMessages,
  ];

  public readonly isDisplay: boolean = true;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(
    interaction: RepliableInteraction,
  ): Promise<InteractionResponse<boolean> | Message | void> {
    if (
      !interaction.isChatInputCommand() ||
      interaction.commandName !== this.name ||
      !CommandUtils.isVaild(interaction)
    )
      return;

    const number = interaction.options.getInteger("number", true);
    const user = interaction.options.getUser("user");

    const isSameUser = interaction.user.id === user?.id;

    if (!isSameUser && !(await CommandUtils.hasPermissions(this, interaction))) return;

    if (number < 1 || number > 100) {
      return await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "数値を確認してください",
              icon_url: config.image.errorIcon,
            },
            description: "入力可能な数値は1件から100件です。確認したうえで再度実行してください。",
          },
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      if (user) {
        const messages = (await interaction.channel.messages.fetch({ limit: 100 }))
          .filter((msg) => user.id === msg.author.id)
          .first(number);

        if (!messages[0])
          return await interaction.reply({
            embeds: [
              {
                color: Colors.Red,
                author: {
                  name: "削除できませんでした",
                  icon_url: config.image.errorIcon,
                },
                description:
                  "指定されたユーザーのメッセージで、2週間以内に送信されたものはありませんでした。",
              },
            ],
            flags: MessageFlags.Ephemeral,
          });

        await interaction.channel.bulkDelete(messages, true);

        await interaction.reply({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: `${user.tag}${isSameUser ? " (あなた)" : ""} のメッセージを${number}個削除しました`,
                icon_url: config.image.successIcon,
              },
            },
          ],
          flags: isSameUser ? MessageFlags.Ephemeral : undefined,
          // 削除したことが知られると、当事者間で余計な問題を誘発しかねない利用場面が想定されるため、一律で非表示にしています。
          // (お願い)このコメントおよびフラグは削除しないでください。
        });
      } else {
        const messages = await interaction.channel.messages.fetch({ limit: number });

        await interaction.channel.bulkDelete(messages, true);

        await interaction.reply({
          embeds: [
            {
              color: Colors.Green,
              author: {
                name: `${number}個のメッセージを削除しました`,
                icon_url: config.image.successIcon,
              },
            },
          ],
        });
      }
    } catch (error) {
      await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "削除できませんでした",
              icon_url: config.image.errorIcon,
            },
            description: "二週間より前のメッセージが含まれていたか、BOTの権限が不足しています",
            fields: [
              {
                name: "エラーコード",
                value: `\`\`\`${error}\`\`\``,
              },
            ],
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
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addIntegerOption((option) =>
        option.setName("number").setDescription("削除するメッセージ数").setRequired(true),
      )
      .addUserOption((option) => option.setName("user").setDescription("削除するユーザー"));
  }
}

export default DelCommand;
