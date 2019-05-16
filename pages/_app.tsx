import * as React from 'react';
import { IntlProvider, addLocaleData } from 'react-intl';
import * as ru from 'react-intl/locale-data/ru';
import App, { AppProps, Container, DefaultAppIProps, NextAppContext } from 'next/app';
import NProgress from 'next-nprogress/component';
import './_app.css';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import sentry from '../server/sentry';
import { BrowserClient } from '@sentry/browser';

const { Sentry, captureException } = sentry();

type ErrorState =
    | {
          hasError: true;
          errorEventId: string;
      }
    | {
          hasError: false;
          errorEventId: undefined;
      };

type MyAppProps = {
    initialNow: number;
} & ErrorState;

type MyAppState = ErrorState;

addLocaleData(ru);

class MyApp extends App<MyAppProps, MyAppState> {
    static async getInitialProps({ Component, ctx }: NextAppContext) {
        let pageProps = {};
        let hasError = false;
        let errorEventId;

        try {
            if (Component.getInitialProps) {
                pageProps = await Component.getInitialProps(ctx);
            }
        } catch (error) {
            hasError = false;
            errorEventId = captureException(error, ctx);
        }

        const initialNow = Date.now();

        return { pageProps, initialNow, hasError, errorEventId };
    }

    static getDerivedStateFromProps(props: MyAppProps & DefaultAppIProps & AppProps, state: MyAppState) {
        // If there was an error generated within getInitialProps, and we haven't
        // yet seen an error, we add it to this.state here
        return {
            hasError: props.hasError || state.hasError || false,
            errorEventId: props.errorEventId || state.errorEventId || undefined
        };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: any, errorInfo: any) {
        const errorEventId = captureException(error, { errorInfo });

        this.setState({ errorEventId });
    }

    state = {
        hasError: false as false,
        errorEventId: undefined
    };

    render() {
        const { Component, pageProps, initialNow } = this.props;

        return (
            <IntlProvider locale="ru" initialNow={initialNow} timeZone="Europe/Moscow">
                <Container>
                    <NProgress />
                    <Header />
                    <main role="main">
                        {this.state.hasError ? (
                            <div style={{ textAlign: 'center' }}>
                                <h1>Что-то пошло не так</h1>
                                <button
                                    type="button"
                                    onClick={() =>
                                        // @ts-ignore
                                        (Sentry as BrowserClient).showReportDialog({ eventId: this.state.errorEventId })
                                    }
                                >
                                    📣 Сообщить об ошибке
                                </button>
                            </div>
                        ) : (
                            <Component {...pageProps} />
                        )}
                    </main>
                    <Footer />
                </Container>
            </IntlProvider>
        );
    }
}

export default MyApp;
