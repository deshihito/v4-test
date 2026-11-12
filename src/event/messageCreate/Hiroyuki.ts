import {
  Client,
  Message,
  Colors,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  WebhookClient,
  WebhookMessageCreateOptions,
} from "discord.js";
import { MessageCreateEvent } from "@/@types/Util";
import config from "@/config";
import RateLimit from "@/util/RateLimit";
import { prisma } from "@/Models/db";
import Random from "@/util/Random";

class HiroyukiEvent implements MessageCreateEvent {
  public readonly client: Client;
  private readonly rateLimit: RateLimit = new RateLimit(800, true);

  constructor(client: Client) {
    this.client = client;
  }

  public async execute(message: Message): Promise<Message | void> {
    if (message.author.bot || !message.inGuild() || message.channel.type !== ChannelType.GuildText)
      return;

    const hiroyukiData = await prisma.hiroyuki.findFirst({
      where: {
        channelId: message.channel.id,
      },
    });

    if (!hiroyukiData) return;

    if (this.rateLimit.count(message.channel.id)) return;

    const filteredMessage = message.cleanContent.slice(0, 40);

    const hiroyukiMsgData = [
      `嘘を嘘と見抜けない人は、${message.guild.name}を使うのは難しいでしょう`,
      `${filteredMessage}？なんすか${filteredMessage}って...`,
      "なんかそういうのって頭悪いか、嘘つきかのどちらかですよ",
      "それで勝った気になってるんですか？だったら相当頭悪いっすね",
      "それってほぼ詐欺ですよね",
      "それって明らかではないですよね？",
      "頭の悪い人は目立つんですよ",
      "それって答えになってないですよね？",
      "それはそう言う風にしか理解できない知能の問題だと思いますけどね",
      "不快感を覚えた自分に驚いたんだよね",
      "それっておかしくないですか？",
      "僕の方が詳しいと思うんすよ",
      "欲しいものを手に入れたいという欲望って、埋まらないんですよ",
      "なんかそういうデータあるんですか？",
      "まず、質問に答えてもらっていいですか？",
      "何だろう。噓つくのやめてもらっていいですか？",
      "そういうのやめてもらっていいですか？",
      "さっきと言ってること違いません？",
      "それってあなたの感想ですよね？",
      "あなた相当頭悪いですよね…",
      "社会ってそんなもんじゃないんですか？",
      "ちょっと日本語わかりづらいんですけどどちらの国の方ですか？",
      "難しいことを楽しめるかどうか。僕は物事がうまくいかないことが好きなんですよ",
      "頭悪いんだからDiscord止めた方がいいっすよ",
      "Bot相手にイラついて恥ずかしくないの？w",
      "それって矛盾してますよね？",
      "根拠なしに話すのやめてもらえますか？",
      "そういう人って一定数いますよね",
      "それって意味がないと思うんです",
      "なんか言いました？",
      "そうなんですねw",
      "反論ありますか？",
      "へぇー",
      "それってあなたの想像ですよね？",
      "おいらのトゥイッターが更新されたんでいいねしてもらってもいいですか？",
      "なんだろう、まだ始まってもないのに諦めるのやめてもらっていいですか？",
      "人間って基本死ぬまでの暇つぶしなんですよ",
      "頭悪い人はそういう思想になりますよね",
      "嘘は嘘であると見抜ける人でないとTakasumiBOTを使うのは難しい",
      "好きなものは好き、だって好きだから。これ以上に、何を語る必要があるだろうか",
      "たいていのことは検索すれば答えが出てくるわけで、個人の知識として蓄える必要があるモノってなかなか無いんですよね",
      "人を応援するって、すごく幸福なことなんですよ",
      "必要なプライドなんてありません！",
      "本当つまんないっすよ",
      "それって明らかではなくて、あなたの感想ですよね？",
      "え。言えないんすか？",
      "はいかいいえで答えてください。",
      "それが偉いんですか？",
      "ダメだこりゃ",
      "なんだろう。",
      "はい論破",
      "学校でしか学べない価値ってなんだろう、、と思ってみると、「役に立たないことに異議を唱えずにやり抜くこと」 なんじゃないかと思ったわけです",
      "事故物件っていいですよね。 事故物件でビデオと回しててワンちゃん何か撮れたら YouTubeとかですげー再生数伸びるんで",
      "目の前にわからないことがあったときに、先生に聞く能力よりも、ググって調べる能力が高くないと、プログラミングはできません",
      "「写像」？なんすか「写像」って...",
    ];

    const koizumiMsgData = [
      "反省はしているが(反省が)見えない自分に対しても反省している",
      `今のままではいけないと思います。だからこそ${message.guild.name}は今のままではいけないと思っている`,
      `いま${message.author.username}がおっしゃる通りとお申しあげました通りでありますし`,
    ];

    const kinnikunMsgData = [
      "やー！",
      "やあ!",
      "パワー!!",
      "おい！俺の筋肉！",
      "つらいことは必ずあるが、経験することで必ず成長する。",
    ];

    const kisidaMsgData = [
      "慎重に検討していく",
      "検討に検討を重ねていきたい",
      "検討を加速させたい",
      "レーシックでもすればいのか？",
      "緊張感を持って対応する",
      `${message.guild.name}についてあらゆる選択肢を排除しない`,
      "検討に検討を重ね検討を加速させていきたい",
    ];

    try {
      let messageData: WebhookMessageCreateOptions | null = null;
      if (Math.random() < 0.01) {
        messageData = {
          content: Random.getRandomElement(koizumiMsgData),
          username: "小泉進次郎",
          avatarURL: config.image.koizumiIcon,
        };
      } else if (Math.random() < 0.01) {
        messageData = {
          content: Random.getRandomElement(kinnikunMsgData),
          username: "なかやまきんに君",
          avatarURL: config.image.kinnikunIcon,
        };
      } else if (Math.random() < 0.007) {
        messageData = {
          content: Random.getRandomElement(kisidaMsgData),
          username: "岸田前総理",
          avatarURL: config.image.kisidaIcon,
        };
      } else if (Math.random() < 0.003) {
        messageData = {
          content: "すいません。3色チーズ牛丼の特盛に温玉付きをお願いします",
          username: "チー牛",
          avatarURL: config.image.tigyuuIcon,
        };
      } else {
        const sentence: string = Random.getRandomElement(hiroyukiMsgData);

        messageData = {
          content: sentence,
          username: "ひろゆき",
          avatarURL: config.image.hiroyukiIcon,
        };
      }

      const webhook = new WebhookClient(
        { url: hiroyukiData.webhookUrl },
        {
          allowedMentions: {
            parse: [],
          },
        },
      );

      await webhook.send(messageData);
    } catch (error) {
      await prisma.hiroyuki.delete({
        where: {
          guildId: message.guildId,
        },
      });

      await message.channel
        .send({
          embeds: [
            {
              color: Colors.Red,
              author: {
                name: "ひろゆき機能でエラーが発生しました",
                icon_url: config.image.errorIcon,
              },
              description:
                "エラーが発生したため、強制的に退出されました\n再度登録するには`/hiroyuki`を使用してください",
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
        })
        .catch(() => {});
    }
  }
}

export default HiroyukiEvent;
