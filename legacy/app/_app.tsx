import React from 'react';
import '@/styles/globals.scss';
import type {AppProps} from 'next/app';

function EtranDevUrls({Component, pageProps}: AppProps) {
    return <Component {...pageProps} />
}

export default EtranDevUrls;