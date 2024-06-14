import { addLog } from '../../../common/system/log';
import { POST } from '../../../common/api/serverRequest';

type PostReRankResponse = {
  // id: string;
  // results: {
  //   index: number;
  //   relevance_score: number;
  // }[];
  data: {
    id: string;
    score: number;
  }[];
};
type ReRankCallResult = { id: string; score?: number }[];

export function reRankRecall({
  query,
  documents
}: {
  query: string;
  documents: { id: string; text: string }[];
}): Promise<ReRankCallResult> {
  const model = global.reRankModels[0];

  if (!model || !model?.requestUrl) {
    return Promise.reject('no rerank model');
  }

  // console.log('------>model?.requestUrl', model?.requestUrl, model?.model);

  let start = Date.now();
  return POST<PostReRankResponse>(
    model.requestUrl,
    {
      // model: model.model,
      query,
      // document: documents.map((doc) => doc.text)
      inputs: documents
    },
    {
      headers: {
        Authorization: `Bearer ${model.requestAuth}`
      },
      timeout: 120000
    }
  )
    .then((data) => {
      console.log('rerank time:', Date.now() - start);
      return data.data;
    })
    .catch((err) => {
      console.log('rerank error:', err);

      return [];
    });
  // .then((data) => {
  //   addLog.info('ReRank finish:', { time: Date.now() - start });

  //   return data?.results?.map((item) => ({
  //     id: documents[item.index].id,
  //     score: item.relevance_score
  //   }));
  // })
  // .catch((err) => {
  //   addLog.error('rerank error', err);

  //   // console.log('------>rerank error', err);

  //   return [];
  // });
}
