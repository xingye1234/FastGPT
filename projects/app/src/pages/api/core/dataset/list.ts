import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import type { DatasetListItemType } from '@fastgpt/global/core/dataset/type.d';
import { DatasetTypeEnum } from '@fastgpt/global/core/dataset/constants';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';
import { mongoRPermission } from '@fastgpt/global/support/permission/utils';
import { authUserRole } from '@fastgpt/service/support/permission/auth/user';
import { getVectorModel } from '@fastgpt/service/core/ai/model';
import { NextAPI } from '@/service/middleware/entry';
import { MongoDatasetCollection } from '@fastgpt/service/core/dataset/collection/schema';
import { Types } from '@fastgpt/service/common/mongo';

async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  const { parentId, type } = req.query as { parentId?: string; type?: DatasetTypeEnum };
  // 凭证校验
  const { teamId, tmbId, teamOwner, role, canWrite } = await authUserRole({
    req,
    authToken: true,
    authApiKey: true
  });

  const datasets = await MongoDataset?.find({
    ...mongoRPermission({ teamId, tmbId, role }),
    ...(parentId !== undefined && { parentId: parentId || null }),
    ...(type && { type })
  })
    .sort({ updateTime: -1 })
    .lean();

  const dataInfos =
    datasets.length &&
    (await Promise.all(
      datasets.map(async (item) => {
        if (item.type !== DatasetTypeEnum.folder) {
          // item.parentId ? new Types.ObjectId(item.parentId) : null
          return {
            ...item,
            canWrite,
            isOwner: teamOwner || String(item.tmbId) === tmbId,
            vectorModel: getVectorModel(item.vectorModel),
            total: await MongoDatasetCollection.countDocuments({
              datasetId: new Types.ObjectId(item._id),
              teamId: new Types.ObjectId(teamId),
              parentId: null
            }),
            dataAmount: await getDatasetDataAmount(item._id, req.cookies.token!)
          };
        } else {
          return {
            ...item,
            canWrite,
            isOwner: teamOwner || String(item.tmbId) === tmbId,
            vectorModel: getVectorModel(item.vectorModel)
          };
        }
      })
    ));

  // const data = await Promise.all(
  //   datasets.map<DatasetListItemType>((item) => ({
  //     _id: item._id,
  //     parentId: item.parentId,
  //     avatar: item.avatar,
  //     name: item.name,
  //     intro: item.intro,
  //     type: item.type,
  //     permission: item.permission,
  //     canWrite,
  //     isOwner: teamOwner || String(item.tmbId) === tmbId,
  //     vectorModel: getVectorModel(item.vectorModel)
  //   }))
  // );

  jsonRes<DatasetListItemType[]>(res, {
    data: (dataInfos as DatasetListItemType[]) || []
  });
}

async function getDatasetDataAmount(datasetId: string, token: string) {
  const _data = await fetch('http://localhost:3000/api/core/dataset/collection/list', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      token
    },
    body: JSON.stringify({
      pageNum: 1,
      pageSize: 99999,
      datasetId,
      parentId: '',
      searchText: ''
    })
  }).then((res) => res.json());

  const dataAmountArr: any[] = _data?.data?.data;

  const count =
    dataAmountArr.length >= 2
      ? dataAmountArr.reduce((acc, cur) => acc + cur.dataAmount, 0)
      : dataAmountArr[0].dataAmount;
  return count;
}

export default NextAPI(handler);
