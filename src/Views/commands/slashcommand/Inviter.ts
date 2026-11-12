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
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import { Command, CommandType, ValidInvite } from "@/@types/Util";
import config from "@/config";
import CommandUtils from "@/Controllers/CommandUtils";

class InviterCommand implements Command {
  public readonly client: Client;

  public readonly type: CommandType = "info";
  public readonly name: string = "inviter";
  public readonly description: string = "招待数ランキングを表示します";
  public readonly example: string[] = ["/inviter"];

  public readonly userPermission: bigint[] = [];

  public readonly botPermission: bigint[] = [PermissionFlagsBits.ManageGuild];

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

    try {
      const invites = (await interaction.guild.invites.fetch())
        .filter((invite): invite is ValidInvite => invite.uses !== 0 && invite.inviterId !== null)
        .reduce<{ [key: string]: ValidInvite[] }>((user, invite) => {
          if (!user[invite.inviterId]) user[invite.inviterId] = [];
          user[invite.inviterId].push(invite);
          return user;
        }, {});

      const count = Object.keys(invites)
        .map((user) => {
          const invite = invites[user][0];
          invite.uses = invites[user].reduce((total, invite) => total + invite.uses, 0);
          return invite;
        })
        .sort((i1, i2) => i2.uses - i1.uses);

      await interaction.reply({
        embeds: [
          {
            color: Colors.Green,
            author: {
              name: "招待ランキング",
              icon_url: config.image.successIcon,
            },
            description: count
              .map((invite, i) => `${i + 1}位 <@${invite.inviterId}>(${invite.uses}回)`)
              .join("\n"),
          },
        ],
      });
    } catch (error) {
      await interaction.reply({
        embeds: [
          {
            color: Colors.Red,
            author: {
              name: "招待リンクを取得できませんでした",
              icon_url: config.image.errorIcon,
            },
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
    return new SlashCommandBuilder().setName(this.name).setDescription(this.description);
  }
}

export default InviterCommand;
