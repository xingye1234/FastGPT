import { type ParentIdType } from '@fastgpt/global/common/parentFolder/type';
import { type FeishuServer, type YuqueServer } from '@fastgpt/global/core/dataset/apiDataset';

export enum ProApiDatasetOperationTypeEnum {
  LIST = 'list',
  READ = 'read',
  CONTENT = 'content',
  DETAIL = 'detail'
}

export type ProApiDatasetCommonParams = {
  feishuServer?: FeishuServer;
  yuqueServer?: YuqueServer;
};

export type GetProApiDatasetFileListParams = ProApiDatasetCommonParams & {
  parentId?: ParentIdType;
};

export type GetProApiDatasetFileContentParams = ProApiDatasetCommonParams & {
  apiFileId: string;
};

export type GetProApiDatasetFilePreviewUrlParams = ProApiDatasetCommonParams & {
  apiFileId: string;
};

export type GetProApiDatasetFileDetailParams = ProApiDatasetCommonParams & {
  apiFileId: string;
};
