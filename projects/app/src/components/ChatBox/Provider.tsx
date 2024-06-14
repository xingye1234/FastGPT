import React, { useContext, createContext, useState, useMemo, useEffect, useCallback } from 'react';
import { useAudioPlay } from '@/web/common/utils/voice';
import { OutLinkChatAuthProps } from '@fastgpt/global/support/permission/chat';
import { StoreNodeItemType } from '@fastgpt/global/core/workflow/type/index.d';
import {
  AppChatConfigType,
  AppTTSConfigType,
  AppWhisperConfigType,
  ChatInputGuideConfigType,
  VariableItemType
} from '@fastgpt/global/core/app/type';
import { ChatSiteItemType } from '@fastgpt/global/core/chat/type';
import {
  defaultChatInputGuideConfig,
  defaultTTSConfig,
  defaultWhisperConfig
} from '@fastgpt/global/core/app/constants';

type useChatStoreType = OutLinkChatAuthProps & {
  welcomeText: string;
  variableList: VariableItemType[];
  questionGuide: boolean;
  ttsConfig: AppTTSConfigType;
  whisperConfig: AppWhisperConfigType;
  autoTTSResponse: boolean;
  startSegmentedAudio: () => Promise<any>;
  splitText2Audio: (text: string, done?: boolean | undefined) => void;
  finishSegmentedAudio: () => void;
  audioLoading: boolean;
  audioPlaying: boolean;
  hasAudio: boolean;
  playAudioByText: ({
    text,
    buffer
  }: {
    text: string;
    buffer?: Uint8Array | undefined;
  }) => Promise<{
    buffer?: Uint8Array | undefined;
  }>;
  cancelAudio: () => void;
  audioPlayingChatId: string | undefined;
  setAudioPlayingChatId: React.Dispatch<React.SetStateAction<string | undefined>>;
  chatHistories: ChatSiteItemType[];
  setChatHistories: React.Dispatch<React.SetStateAction<ChatSiteItemType[]>>;
  isChatting: boolean;
  chatInputGuide: ChatInputGuideConfigType;
};
const StateContext = createContext<useChatStoreType>({
  welcomeText: '',
  variableList: [],
  questionGuide: false,
  ttsConfig: {
    type: 'none',
    model: undefined,
    voice: undefined,
    speed: undefined
  },
  whisperConfig: {
    open: false,
    autoSend: false,
    autoTTSResponse: false
  },
  autoTTSResponse: false,
  startSegmentedAudio: function (): Promise<any> {
    throw new Error('Function not implemented.');
  },
  splitText2Audio: function (text: string, done?: boolean | undefined): void {
    throw new Error('Function not implemented.');
  },
  chatHistories: [],
  setChatHistories: function (value: React.SetStateAction<ChatSiteItemType[]>): void {
    throw new Error('Function not implemented.');
  },
  isChatting: false,
  audioLoading: false,
  audioPlaying: false,
  hasAudio: false,
  playAudioByText: function ({
    text,
    buffer
  }: {
    text: string;
    buffer?: Uint8Array | undefined;
  }): Promise<{ buffer?: Uint8Array | undefined }> {
    throw new Error('Function not implemented.');
  },
  cancelAudio: function (): void {
    throw new Error('Function not implemented.');
  },
  audioPlayingChatId: undefined,
  setAudioPlayingChatId: function (value: React.SetStateAction<string | undefined>): void {
    throw new Error('Function not implemented.');
  },
  finishSegmentedAudio: function (): void {
    throw new Error('Function not implemented.');
  },
  chatInputGuide: {
    open: false,
    customUrl: ''
  }
});

export type ChatProviderProps = OutLinkChatAuthProps & {
  chatConfig?: AppChatConfigType;

  // not chat test params
  chatId?: string;
  children: React.ReactNode;
};

export const useChatProviderStore = () => useContext(StateContext);

const Provider = ({
  shareId,
  outLinkUid,
  teamId,
  teamToken,
  chatConfig = {},
  children
}: ChatProviderProps) => {
  const [chatHistories, setChatHistories] = useState<ChatSiteItemType[]>([]);

  const {
    welcomeText = '',
    variables = [],
    questionGuide = false,
    ttsConfig = defaultTTSConfig,
    whisperConfig = defaultWhisperConfig,
    chatInputGuide = defaultChatInputGuideConfig
  } = useMemo(() => chatConfig, [chatConfig]);

  // segment audio
  const [audioPlayingChatId, setAudioPlayingChatId] = useState<string>();
  const {
    audioLoading,
    audioPlaying,
    hasAudio,
    playAudioByText,
    cancelAudio,
    startSegmentedAudio,
    finishSegmentedAudio,
    splitText2Audio
  } = useAudioPlay({
    ttsConfig,
    shareId,
    outLinkUid,
    teamId,
    teamToken
  });

  const autoTTSResponse =
    whisperConfig?.open && whisperConfig?.autoSend && whisperConfig?.autoTTSResponse && hasAudio;

    // console.log('chatHistories',chatHistories)

  const isChatting = useMemo(
    () =>
      chatHistories[chatHistories.length - 1] &&
      chatHistories[chatHistories.length - 1]?.status !== 'finish',
    [chatHistories]
  );

  const value: useChatStoreType = {
    shareId,
    outLinkUid,
    teamId,
    teamToken,
    welcomeText,
    variableList: variables,
    questionGuide,
    ttsConfig,
    whisperConfig,
    autoTTSResponse,
    startSegmentedAudio,
    finishSegmentedAudio,
    splitText2Audio,
    audioLoading,
    audioPlaying,
    hasAudio,
    playAudioByText,
    cancelAudio,
    audioPlayingChatId,
    setAudioPlayingChatId,
    chatHistories,
    setChatHistories,
    isChatting,
    chatInputGuide
  };

  return <StateContext.Provider value={value}>{children}</StateContext.Provider>;
};

export default React.memo(Provider);
