import React, { useState, Dispatch, useCallback } from 'react';
import { FormControl, Flex, Input, Button, Box, Link, Image } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { LoginPageTypeEnum } from '@/web/support/user/login/constants';
import { postLogin } from '@/web/support/user/api';
import type { ResLogin } from '@/global/support/api/userRes';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { getDocPath } from '@/web/common/system/doc';
import { useTranslation } from 'next-i18next';
import FormLayout from './components/FormLayout';

interface Props {
  setPageType: Dispatch<`${LoginPageTypeEnum}`>;
  loginSuccess: (e: ResLogin) => void;
}

interface LoginFormType {
  username: string;
  password: string;
}

const LoginForm = ({ setPageType, loginSuccess }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { feConfigs } = useSystemStore();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormType>();

  const [requesting, setRequesting] = useState(false);

  const onclickLogin = useCallback(
    async ({ username, password }: LoginFormType) => {
      setRequesting(true);
      try {
        loginSuccess(
          await postLogin({
            username,
            password
          })
        );
        toast({
          title: '登录成功',
          status: 'success'
        });
      } catch (error: any) {
        toast({
          title: error.message || '登录异常',
          status: 'error'
        });
      }
      setRequesting(false);
    },
    [loginSuccess, toast]
  );

  const isCommunityVersion = feConfigs?.show_register === false && !feConfigs?.isPlus;

  const loginOptions = [
    feConfigs?.show_phoneLogin ? t('support.user.login.Phone number') : '',
    feConfigs?.show_emailLogin ? t('support.user.login.Email') : '',
    t('support.user.login.Username')
  ].filter(Boolean);

  const placeholder = isCommunityVersion
    ? t('support.user.login.Root login')
    : loginOptions.join('/');

  return (
    <FormLayout setPageType={setPageType} pageType={LoginPageTypeEnum.passwordLogin}>
      <Flex
        mt={['42px', '32px']}
        bgColor={'#E1EAF7'}
        flexDirection={['column', 'row']}
        p={4}
        borderRadius={'sm'}
        onKeyDown={(e) => {
          if (e.keyCode === 13 && !e.shiftKey && !requesting) {
            handleSubmit(onclickLogin)();
          }
        }}
      >
        <FormControl isInvalid={!!errors.username} mt={[6, 0]} mx={[0, 2]}>
          <Box alignItems={'center'} position={'relative'}>
            <Image
              src="/imgs/login/user.png"
              w={'13px'}
              h={'16px'}
              top={5}
              left={4}
              position={'absolute'}
              zIndex={10}
            ></Image>
            <Input
              bg={'myWhite.50'}
              fontSize={'16px'}
              h={'48px'}
              px={10}
              placeholder={placeholder}
              {...register('username', {
                required: true
              })}
            ></Input>
          </Box>
        </FormControl>
        <FormControl isInvalid={!!errors.password} mt={[6, 0]} mx={[0, 2]}>
          {/* <img src="/imgs/login/user.png" alt="" /> */}

          <Box alignItems={'center'} position={'relative'}>
            <Image
              src="/imgs/login/pas.png"
              w={'14px'}
              h={'16px'}
              top={5}
              left={4}
              position={'absolute'}
              zIndex={10}
            ></Image>
            <Input
              bg={'myWhite.50'}
              type={'password'}
              fontSize={'16px'}
              h={'48px'}
              px={10}
              placeholder={
                isCommunityVersion
                  ? t('support.user.login.Root password placeholder')
                  : t('support.user.login.Password')
              }
              {...register('password', {
                required: true,
                maxLength: {
                  value: 60,
                  message: '密码最多 60 位'
                }
              })}
            ></Input>
          </Box>
        </FormControl>

        <Button
          mt={[6, 0]}
          mx={[0, 2]}
          type="submit"
          w={['100%', '12%']}
          size={['md', 'lg']}
          h={'48px!'}
          colorScheme="blue"
          isLoading={requesting}
          onClick={handleSubmit(onclickLogin)}
          fontWeight={'bold!'}
          bg={'linear-gradient(0deg, #0F7AEA 0%, #288FEF 100%)'}
          letterSpacing={'0.20em'}
        >
          {t('Login')}
        </Button>
        {/* feConfigs?.show_register */}
        {false && (
          <>
            <Flex align={'center'} justifyContent={'flex-end'} color={'primary.700'}>
              <Box
                cursor={'pointer'}
                _hover={{ textDecoration: 'underline' }}
                onClick={() => setPageType('forgetPassword')}
                fontSize="sm"
              >
                {t('support.user.login.Forget Password')}
              </Box>
              <Box mx={3} h={'16px'} w={'1.5px'} bg={'myGray.250'}></Box>
              <Box
                cursor={'pointer'}
                _hover={{ textDecoration: 'underline' }}
                onClick={() => setPageType('register')}
                fontSize="sm"
              >
                {t('support.user.login.Register')}
              </Box>
            </Flex>
          </>
        )}
      </Flex>
    </FormLayout>
  );
};

export default LoginForm;
