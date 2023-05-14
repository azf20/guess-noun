import { ThemingProps } from '@chakra-ui/react'
import { localhost, optimismGoerli } from '@wagmi/chains'

export const SITE_NAME = 'Guess Noun'
export const SITE_DESCRIPTION = 'Optimism is a Noun'
export const SITE_URL = 'https://nexth.vercel.app'

export const THEME_INITIAL_COLOR = 'system'
export const THEME_COLOR_SCHEME: ThemingProps['colorScheme'] = 'gray'
export const THEME_CONFIG = {
  initialColorMode: THEME_INITIAL_COLOR,
}

export const SOCIAL_TWITTER = 'wslyvh'
export const SOCIAL_GITHUB = 'wslyvh/nexth'

export const ETH_CHAINS = [localhost, optimismGoerli]

export const SERVER_SESSION_SETTINGS = {
  cookieName: SITE_NAME,
  password: process.env.SESSION_PASSWORD ?? 'UPDATE_TO_complex_password_at_least_32_characters_long',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
}
