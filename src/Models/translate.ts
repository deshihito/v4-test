import { TranslateResponse } from "@/@types/Api";

const translate = async (
  text: string,
  source: string,
  target: string,
): Promise<{ text: string; source: string }> => {
  const data: TranslateResponse = await fetch(
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&dj=1&q=${encodeURIComponent(text)}`,
  ).then((res) => res.json());
  //TODO: パースの調整
  return {
    text: data.sentences.map((sentence) => sentence.trans).join(""),
    source: data.src,
  };
};

export default translate;
