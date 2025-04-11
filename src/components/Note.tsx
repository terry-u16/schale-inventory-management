import { type FC } from 'react';
import { Box, Container, Paper, Stack, Typography } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';

const Note: FC = () => {
  const { t } = useTranslation('Note');

  return (
    <>
      <Paper>
        <Box p={2}>
          <Container maxWidth="md">
            <Stack spacing={6} my={4} sx={{ textAlign: 'start' }}>
              <Stack spacing={1}>
                <Typography variant="h4">{t('what_is_this.0')}</Typography>
                <Typography variant="body1">
                  {t('what_is_this.1')}
                  <a
                    href="https://bluearchive.jp/"
                    target="_brank"
                    rel="noreferrer"
                  >
                    {t('what_is_this.2')}
                  </a>
                  {t('what_is_this.3')}
                </Typography>
                <Typography variant="body1">{t('what_is_this.4')}</Typography>
              </Stack>

              <Stack spacing={3}>
                <Typography variant="h4">{t('how_to_use.header')}</Typography>
                <Stack spacing={1}>
                  <Typography variant="h5">{t('how_to_use.1.0')}</Typography>
                  <Typography variant="body1">{t('how_to_use.1.1')}</Typography>
                  <Typography variant="body1">{t('how_to_use.1.2')}</Typography>
                </Stack>

                <Stack spacing={1}>
                  <Typography variant="h5">{t('how_to_use.2.0')}</Typography>
                  <Typography variant="body1">{t('how_to_use.2.1')}</Typography>
                  <Typography variant="body1">{t('how_to_use.2.2')}</Typography>
                </Stack>

                <Stack spacing={1}>
                  <Typography variant="h5">{t('how_to_use.3.0')}</Typography>
                  <Typography variant="body1">{t('how_to_use.3.1')}</Typography>
                  <Typography variant="body1">{t('how_to_use.3.2')}</Typography>
                  <Typography variant="body1">
                    <Trans
                      i18nKey="Note:how_to_use.3.3"
                      components={{ b: <b /> }}
                    />
                  </Typography>
                </Stack>
              </Stack>

              <Stack spacing={3}>
                <Typography variant="h4">{t('faq.header')}</Typography>

                <Stack spacing={1}>
                  <Typography variant="h5">{t('faq.1.0')}</Typography>
                  <Typography variant="body1">{t('faq.1.1')}</Typography>
                </Stack>

                <Stack spacing={1}>
                  <Typography variant="h5">{t('faq.2.0')}</Typography>
                  <Typography variant="body1">{t('faq.2.1')}</Typography>
                </Stack>

                <Stack spacing={1}>
                  <Typography variant="h5">{t('faq.3.0')}</Typography>
                  <Typography variant="body1">
                    {t('faq.3.1')}
                    <a
                      href="https://twitter.com/terry_u16"
                      target="_brank"
                      rel="noreferrer"
                    >
                      {t('faq.3.2')}
                    </a>
                    {t('faq.3.3')}
                  </Typography>
                </Stack>

                <Stack spacing={1}>
                  <Typography variant="h5">{t('faq.4.0')}</Typography>
                  <Typography variant="body1">{t('faq.4.1')}</Typography>
                </Stack>

                <Stack spacing={1}>
                  <Typography variant="h5">{t('faq.5.0')}</Typography>
                  <Typography variant="body1">{t('faq.5.1')}</Typography>
                </Stack>

                <Stack spacing={1}>
                  <Typography variant="h5">{t('faq.6.0')}</Typography>
                  <Typography variant="body1">{t('faq.6.1')}</Typography>
                  <Typography variant="body1">
                    <Trans i18nKey="Note:faq.6.2" components={{ s: <s /> }} />
                  </Typography>
                </Stack>

                <Stack spacing={1}>
                  <Typography variant="h5">{t('faq.7.0')}</Typography>
                  <Typography variant="body1">{t('faq.7.1')}</Typography>
                  <ul>
                    <li>
                      <Typography variant="body1">
                        {t('faq.7.2')}
                        <a
                          href="https://twitter.com/chokudai/status/1778760450215383085"
                          target="_brank"
                          rel="noreferrer"
                        >
                          {t('faq.7.3')}
                        </a>
                        {t('faq.7.4')}
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body1">{t('faq.7.5')}</Typography>
                    </li>
                    <li>
                      <Typography variant="body1">{t('faq.7.6')}</Typography>
                    </li>
                  </ul>
                  <Typography variant="caption">{t('faq.7.7')}</Typography>
                </Stack>

                <Stack spacing={1}>
                  <Typography variant="h5">{t('faq.8.0')}</Typography>
                  <Typography variant="body1">{t('faq.8.1')}</Typography>
                  <Typography variant="body1">
                    {t('faq.8.2')}
                    <a
                      href="https://atcoder.jp/"
                      target="_brank"
                      rel="noreferrer"
                    >
                      AtCoder
                    </a>
                    {t('faq.8.3')}
                    <a
                      href="https://atcoder.jp/contests/ahc030"
                      target="_brank"
                      rel="noreferrer"
                    >
                      AtCoder Heuristic Contest 030
                    </a>
                    {t('faq.8.4')}
                  </Typography>

                  <Typography variant="caption">{t('faq.8.5')}</Typography>
                </Stack>

                <Stack spacing={1}>
                  <Typography variant="h5">{t('faq.9.0')}</Typography>
                  <Typography variant="body1">{t('faq.9.1')}</Typography>
                </Stack>
              </Stack>

              <Stack spacing={1}>
                <Typography variant="h4">{t('about_developer.0')}</Typography>
                <Typography variant="body1">
                  {t('about_developer.1')}
                  <a
                    href="https://twitter.com/terry_u16"
                    target="_brank"
                    rel="noreferrer"
                  >
                    terry_u16
                  </a>
                  {t('about_developer.2')}
                </Typography>
                <Typography variant="body1">
                  {t('about_developer.3')}
                  <a
                    href="https://github.com/terry-u16/schale-inventory-management"
                    target="_brank"
                    rel="noreferrer"
                  >
                    {t('about_developer.4')}
                  </a>
                  {t('about_developer.5')}
                </Typography>
              </Stack>

              <Stack spacing={1}>
                <Typography variant="h4">Special Thanks</Typography>
                <Typography variant="body1">{t('special_thanks.0')}</Typography>
                <ul>
                  <li>
                    <Typography variant="body1">
                      {t('special_thanks.1')}
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body1">
                      {t('special_thanks.2')}
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body1">
                      {t('special_thanks.3')}
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body1">
                      {t('special_thanks.4')}
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body1">
                      {t('special_thanks.5')}
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body1">
                      {t('special_thanks.6')}
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body1">
                      {t('special_thanks.7')}
                    </Typography>
                  </li>
                </ul>
              </Stack>
            </Stack>
          </Container>
        </Box>
      </Paper>
    </>
  );
};

export default Note;
