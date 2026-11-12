import {
  Client,
  RepliableInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  InteractionResponse,
  PermissionFlagsBits,
  TextInputBuilder,
  LabelBuilder,
  ModalBuilder,
  TextInputStyle,
  Colors,
  MessageFlags,
  ChannelType,
} from "discord.js";
import { Command, CommandType } from "@/@types/Util";
import CommandUtils from "@/util/CommandUtils";
import config from "@/config";
import { prisma } from "@/Models/db";

class RegisterCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "server";
  public readonly name: string = "register";
  public readonly description: string = "サーバー掲示板に登録や登録を解除します";
  public readonly example: string[] = ["/register"];

  public readonly userPermission: bigint[] = [PermissionFlagsBits.Administrator];

  public readonly botPermission: bigint[] = [PermissionFlagsBits.CreateInstantInvite];

  public readonly isDisplay: boolean = true;

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(
    interaction: RepliableInteraction,
  ): Promise<InteractionResponse<boolean> | void> {
    if (
      !interaction.isChatInputCommand() ||
      interaction.commandName !== this.name ||
      !CommandUtils.isVaild(interaction) ||
      !(await CommandUtils.hasPermissions(this, interaction))
    )
      return;

    const registerData = await prisma.guildBoard.findUnique({
      where: {
        guildId: interaction.guildId,
      },
    });

    if (registerData) {
      await prisma.guildBoard.delete({
        where: {
          guildId: interaction.guildId,
        },
      });

      await interaction.reply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "掲示板の登録を解除しました",
              icon_url: config.image.successIcon,
            },
          },
        ],
      });
    } else {
      if (
        interaction.guild.members.me.joinedAt &&
        Date.now() - interaction.guild.members.me.joinedAt.getTime() < 86400000 * 3
      )
        return await interaction.reply({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "登録できませんでした",
                icon_url: config.image.errorIcon,
              },
              description:
                "サーバー掲示板に登録するにはBOTをサーバーに追加してから3日経過する必要があります",
            },
          ],
          flags: MessageFlags.Ephemeral,
        });

      if ((await interaction.guild.members.fetch()).filter((m) => !m.user.bot).size < 15)
        return await interaction.reply({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "登録できませんでした",
                icon_url: config.image.errorIcon,
              },
              description: "サーバー掲示板に登録するにはサーバーに15人以上のユーザーが必要です",
            },
          ],
          flags: MessageFlags.Ephemeral,
        });

      if (
        interaction.channel.type !== ChannelType.GuildText &&
        interaction.channel.type !== ChannelType.GuildVoice &&
        interaction.channel.type !== ChannelType.GuildAnnouncement &&
        interaction.channel.type !== ChannelType.GuildStageVoice
      )
        return await interaction.reply({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "登録できませんでした",
                icon_url: config.image.errorIcon,
              },
              description: "テキストベースのチャンネルで実行してください",
            },
          ],
          flags: MessageFlags.Ephemeral,
        });

      const description = new LabelBuilder()
        .setLabel("サーバーの説明文")
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId("description")
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(180)
            .setMinLength(30),
        );

      const register = new ModalBuilder()
        .setCustomId("register")
        .setTitle("サーバー掲示板の登録")
        .addLabelComponents(description);

      await interaction.showModal(register);
    }
  }

  public build(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder().setName(this.name).setDescription(this.description);
  }
}

export default RegisterCommand;
