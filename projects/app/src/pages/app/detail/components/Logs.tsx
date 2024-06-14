import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Flex,
  Box,
  TableContainer,
  Table,
  Thead,
  Tr,
  Th,
  Td,
  Tbody,
  useTheme,
  useDisclosure,
  ModalBody,
  Card,
  CardBody,
  Grid,
  Text
} from '@chakra-ui/react';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useTranslation } from 'next-i18next';
import { getAppChatLogs } from '@/web/core/app/api';
import dayjs from 'dayjs';
import { ChatSourceMap } from '@fastgpt/global/core/chat/constants';
import { HUMAN_ICON } from '@fastgpt/global/common/system/constants';
import { AppLogsListItemType } from '@/types/app';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import ChatBox from '@/components/ChatBox';
import type { ComponentRef } from '@/components/ChatBox/type.d';
import { useQuery } from '@tanstack/react-query';
import { getInitChatInfo } from '@/web/core/chat/api';
import Tag from '@fastgpt/web/components/common/Tag/index';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { addDays } from 'date-fns';
import MyBox from '@fastgpt/web/components/common/MyBox';
import { usePagination } from '@fastgpt/web/hooks/usePagination';
import DateRangePicker, { DateRangeType } from '@fastgpt/web/components/common/DateRangePicker';
import { formatChatValue2InputType } from '@/components/ChatBox/utils';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import { useI18n } from '@/web/context/I18n';
import type { IconNameType } from '@fastgpt/web/components/common/Icon/type.d';
import LineEcharts from './LineEcharts';

interface ICardList {
  id: string;
  name: string;
  icon: IconNameType;
  icons?: IconNameType;
  bgcolor: string;
  sum: any[];
  option: {
    title: string;
    xData: any[];
    yData: any[];
  };
}

function getAttrsArray(array: Array<any>, attr: string) {
  if (attr === 'messageCount') {
    return array.map((item) => {
      return item[attr] > 0 ? Math.ceil(item[attr] / 2) : item[attr];
    });
  }
  return array.map((item) => {
    return item[attr];
  });
}

function getAttrsArrayTime(array: Array<any>, attr: string) {
  return array.map((item) => {
    return new Date(item[attr]).toLocaleDateString();
  });
}

function getSum(array: Array<any>): number {
  return array.reduce((total, item) => total + item, 0);
}

const Logs = ({ appId }: { appId: string }) => {
  const { t } = useTranslation();
  const { appT } = useI18n();

  const { isPc } = useSystemStore();

  const [dateRange, setDateRange] = useState<DateRangeType>({
    from: addDays(new Date(), -7),
    to: new Date()
  });

  const {
    isOpen: isOpenMarkDesc,
    onOpen: onOpenMarkDesc,
    onClose: onCloseMarkDesc
  } = useDisclosure();

  const {
    data: logs,
    isLoading,
    Pagination,
    getData,
    pageNum
  } = usePagination<AppLogsListItemType>({
    api: getAppChatLogs,
    pageSize: 20,
    params: {
      appId,
      dateStart: dateRange.from || new Date(),
      dateEnd: addDays(dateRange.to || new Date(), 1)
    }
  });

  const [detailLogsId, setDetailLogsId] = useState<string>();

  const logsData: ICardList[] = useMemo(() => {
    const reverses = [...logs].reverse();

    const keys = reverses.reduce((acc: any, cur: any) => {
      const time = cur.time.split('T')[0];
      if (acc[time]) {
        acc[time].messageCount += cur.messageCount;
        acc[time].userGoodFeedbackCount += cur.userGoodFeedbackCount;
        acc[time].userBadFeedbackCount += cur.userBadFeedbackCount;
        return acc;
      }
      return {
        ...acc,
        [time]: {
          ...cur
        }
      };
    }, {});

    const reverseLogs = Object.values(keys);

    return [
      {
        id: 'chatRecordCharts',
        name: '提问次数',
        icon: 'core/chat/chatLight',
        bgcolor: '#e5fbf8',
        sum: [getSum(getAttrsArray(reverseLogs, 'messageCount')) || 0],
        option: {
          title: '提问次数',
          xData: getAttrsArrayTime(reverseLogs, 'time'),
          yData: [
            {
              type: 'line',
              data: getAttrsArray(reverseLogs, 'messageCount')
            }
          ]
        }
      },
      {
        id: 'starCharts',
        name: '用户满意度',
        icon: 'core/chat/feedback/goodLight',
        icons: 'core/chat/feedback/badLight',
        bgcolor: '#feedec',
        sum: [
          getSum(getAttrsArray(reverseLogs, 'userGoodFeedbackCount') || 0),
          getSum(getAttrsArray(reverseLogs, 'userBadFeedbackCount') || 0)
        ],
        option: {
          title: '用户满意度',
          xData: getAttrsArrayTime(reverseLogs, 'time'),
          yData: [
            {
              name: '赞同',
              type: 'line',
              data: getAttrsArray(reverseLogs, 'userGoodFeedbackCount')
            },
            {
              name: '反对',
              type: 'line',
              data: getAttrsArray(reverseLogs, 'userBadFeedbackCount')
            }
          ]
        }
      }
    ];
  }, [logs]);

  return (
    <Flex flexDirection={'column'} h={'100%'} p={6} position={'relative'} bgColor={'#f5f6f7'}>
      {isPc && (
        <>
          <Box fontWeight={'bold'} fontSize={['md', 'xl']} mb={2}>
            {appT('Chat logs')}
          </Box>
          <Box color={'myGray.500'} fontSize={'sm'} mb={2}>
            {appT('Chat Logs Tips')},{' '}
            <Box
              as={'span'}
              mr={2}
              textDecoration={'underline'}
              cursor={'pointer'}
              onClick={onOpenMarkDesc}
            >
              {t('core.chat.Read Mark Description')}
            </Box>
          </Box>
        </>
      )}

      <Flex bgColor={'white'} borderRadius={'md'} h={'94%'} p={4}>
        {/* 图表 */}
        <Box w={'30%'} mr={2}>
          <Grid gridTemplateColumns={'repeat(2, 1fr)'} gap={6}>
            {logsData.map((item: ICardList) => (
              <Card key={item.id} borderRadius={'sm'}>
                <CardBody display={'flex'}>
                  <Box bgColor={item.bgcolor} p={2} mr={4} borderRadius={'sm'}>
                    <MyIcon name={item.icon} w={'28px'} />
                  </Box>
                  <Box>
                    <Text fontSize={'md'} color={'myGray.500'}>
                      {item.name}
                    </Text>
                    <Box fontSize={'lg'} fontWeight={'bold'}>
                      {item.name === '用户满意度' ? (
                        <Flex>
                          <MyIcon name={item.icon} w={'16px'} color={'green.600'} />
                          <Text mr={4}>{item.sum[0]}</Text>
                          <MyIcon name={item.icons!} w={'16px'} color={'red.600'} />
                          <Text>{item.sum[1]}</Text>
                        </Flex>
                      ) : (
                        item.sum
                      )}
                    </Box>
                  </Box>
                </CardBody>
              </Card>
            ))}
          </Grid>

          <Grid gridTemplateColumns={'repeat(1, 1fr)'} gap={6} mt={4}>
            {logsData.map((item) => (
              <Box key={item.id}>
                <LineEcharts height="316px" id={item.id} opt={item.option} />
              </Box>
            ))}
          </Grid>
        </Box>
        <Box w={'70%'} ml={2}>
          {/* table */}
          <TableContainer mt={[0, 3]} flex={'1 0 0'} h={'auto'} overflowY={'auto'}>
            <Table variant={'simple'} fontSize={'sm'}>
              <Thead>
                <Tr>
                  <Th>{t('core.app.logs.Source And Time')}</Th>
                  <Th>{appT('Logs Title')}</Th>
                  <Th>{appT('Logs Message Total')}</Th>
                  <Th>{appT('Feedback Count')}</Th>
                  <Th>{t('core.app.feedback.Custom feedback')}</Th>
                  <Th>{appT('Mark Count')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {logs.map((item) => (
                  <Tr
                    key={item._id}
                    _hover={{ bg: 'myWhite.600' }}
                    cursor={'pointer'}
                    title={'点击查看对话详情'}
                    onClick={() => setDetailLogsId(item.id)}
                  >
                    <Td>
                      <Box>{t(ChatSourceMap[item.source]?.name || 'UnKnow')}</Box>
                      <Box color={'myGray.500'}>{dayjs(item.time).format('YYYY/MM/DD HH:mm')}</Box>
                    </Td>
                    <Td className="textEllipsis" maxW={'250px'}>
                      {item.title}
                    </Td>
                    <Td>{item.messageCount}</Td>
                    <Td w={'100px'}>
                      {!!item?.userGoodFeedbackCount && (
                        <Flex
                          mb={item?.userGoodFeedbackCount ? 1 : 0}
                          bg={'green.100'}
                          color={'green.600'}
                          px={3}
                          py={1}
                          alignItems={'center'}
                          justifyContent={'center'}
                          borderRadius={'md'}
                          fontWeight={'bold'}
                        >
                          <MyIcon
                            mr={1}
                            name={'core/chat/feedback/goodLight'}
                            color={'green.600'}
                            w={'14px'}
                          />
                          {item.userGoodFeedbackCount}
                        </Flex>
                      )}
                      {!!item?.userBadFeedbackCount && (
                        <Flex
                          bg={'#FFF2EC'}
                          color={'#C96330'}
                          px={3}
                          py={1}
                          alignItems={'center'}
                          justifyContent={'center'}
                          borderRadius={'md'}
                          fontWeight={'bold'}
                        >
                          <MyIcon
                            mr={1}
                            name={'core/chat/feedback/badLight'}
                            color={'#C96330'}
                            w={'14px'}
                          />
                          {item.userBadFeedbackCount}
                        </Flex>
                      )}
                      {!item?.userGoodFeedbackCount && !item?.userBadFeedbackCount && <>-</>}
                    </Td>
                    <Td>{item.customFeedbacksCount || '-'}</Td>
                    <Td>{item.markCount}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
          <Flex w={'100%'} p={4} alignItems={'center'} justifyContent={'flex-end'}>
            <DateRangePicker
              defaultDate={dateRange}
              position="top"
              onChange={setDateRange}
              onSuccess={() => getData(1)}
            />
            <Box ml={3}>
              <Pagination />
            </Box>
          </Flex>
          {logs.length === 0 && !isLoading && (
            <Flex h={'100%'} flexDirection={'column'} alignItems={'center'} pt={'10vh'}>
              <MyIcon name="empty" w={'48px'} h={'48px'} color={'transparent'} />
              <Box mt={2} color={'myGray.500'}>
                {appT('Logs Empty')}
              </Box>
            </Flex>
          )}

          {!!detailLogsId && (
            <DetailLogsModal
              appId={appId}
              chatId={detailLogsId}
              onClose={() => {
                setDetailLogsId(undefined);
                getData(pageNum);
              }}
            />
          )}
          <MyModal
            isOpen={isOpenMarkDesc}
            onClose={onCloseMarkDesc}
            title={t('core.chat.Mark Description Title')}
          >
            <ModalBody whiteSpace={'pre-wrap'}>{t('core.chat.Mark Description')}</ModalBody>
          </MyModal>
        </Box>
      </Flex>
    </Flex>
  );
};

export default React.memo(Logs);

const DetailLogsModal = ({
  appId,
  chatId,
  onClose
}: {
  appId: string;
  chatId: string;
  onClose: () => void;
}) => {
  const ChatBoxRef = useRef<ComponentRef>(null);
  const { isPc } = useSystemStore();
  const theme = useTheme();

  const { data: chat, isFetching } = useQuery(
    ['getChatDetail', chatId],
    () => getInitChatInfo({ appId, chatId, loadCustomFeedbacks: true }),
    {
      onSuccess(res) {
        const history = res.history.map((item) => ({
          ...item,
          dataId: item.dataId || getNanoid(),
          status: 'finish' as any
        }));
        ChatBoxRef.current?.resetHistory(history);
        ChatBoxRef.current?.resetVariables(res.variables);
        if (res.history.length > 0) {
          setTimeout(() => {
            ChatBoxRef.current?.scrollToBottom('auto');
          }, 500);
        }
      }
    }
  );

  const history = useMemo(() => (chat?.history ? chat.history : []), [chat]);

  const title = useMemo(() => {
    const { text } = formatChatValue2InputType(history[history.length - 2]?.value);
    return text?.slice(0, 8);
  }, [history]);
  const chatModels = chat?.app?.chatModels;

  return (
    <>
      <MyBox
        isLoading={isFetching}
        display={'flex'}
        flexDirection={'column'}
        zIndex={3}
        position={['fixed', 'absolute']}
        top={[0, '2%']}
        right={0}
        h={['100%', '96%']}
        w={'100%'}
        maxW={['100%', '600px']}
        bg={'white'}
        boxShadow={'3px 0 20px rgba(0,0,0,0.2)'}
        borderRadius={'md'}
        overflow={'hidden'}
        transition={'.2s ease'}
      >
        <Flex
          alignItems={'center'}
          px={[3, 5]}
          h={['46px', '60px']}
          borderBottom={theme.borders.base}
          borderBottomColor={'gray.200'}
          color={'myGray.900'}
        >
          {isPc ? (
            <>
              <Box mr={3} color={'myGray.1000'}>
                {title}
              </Box>
              <Tag>
                <MyIcon name={'history'} w={'14px'} />
                <Box ml={1}>{`${history.length}条记录`}</Box>
              </Tag>
              {!!chatModels && chatModels.length > 0 && (
                <Tag ml={2} colorSchema={'green'}>
                  <MyIcon name={'core/chat/chatModelTag'} w={'14px'} />
                  <Box ml={1}>{chatModels.join(',')}</Box>
                </Tag>
              )}
              <Box flex={1} />
            </>
          ) : (
            <>
              <Flex px={3} alignItems={'center'} flex={'1 0 0'} w={0} justifyContent={'center'}>
                <Box ml={1} className="textEllipsis">
                  {title}
                </Box>
              </Flex>
            </>
          )}

          <Flex
            alignItems={'center'}
            justifyContent={'center'}
            w={'20px'}
            h={'20px'}
            borderRadius={'50%'}
            cursor={'pointer'}
            _hover={{ bg: 'myGray.100' }}
            onClick={onClose}
          >
            <MyIcon name={'common/closeLight'} w={'12px'} h={'12px'} color={'myGray.700'} />
          </Flex>
        </Flex>
        <Box pt={2} flex={'1 0 0'}>
          <ChatBox
            ref={ChatBoxRef}
            appAvatar={chat?.app.avatar}
            userAvatar={HUMAN_ICON}
            feedbackType={'admin'}
            showMarkIcon
            showVoiceIcon={false}
            chatConfig={chat?.app?.chatConfig}
            appId={appId}
            chatId={chatId}
          />
        </Box>
      </MyBox>
      <Box zIndex={2} position={'fixed'} top={0} left={0} bottom={0} right={0} onClick={onClose} />
    </>
  );
};
