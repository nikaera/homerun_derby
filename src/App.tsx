import './App.css';
import React, { useState, useCallback } from 'react';

import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import CssBaseline from "@material-ui/core/CssBaseline";

import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';

import Game from './GameComponent';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

import * as BABYLON from 'babylonjs';

const theme = createMuiTheme({
  spacing: 4,
  typography: {
    fontSize: 14,
    fontFamily: 'PixelMplus10, Arial',
  },
  palette: {
    background: {
      default: '#F2F2F2'
    },
    text: {
      primary: '#181E40',
      secondary: '#181E40'
    }
  }
});

const useStyles = makeStyles(theme => ({
  root: {
    margin: theme.spacing(4),
    flexGrow: 1
  },
  title: {
    padding: theme.spacing(1),
    textAlign: 'center',
    fontSize: 24
  },
  gameInfo: {
    paddingLeft: 12,
    height: 'auto'
  },
  gameHint: {
    color: 'red'
  },
}));

const HOMERUN_KING = 10;
const MATCH_MAX = 3;

interface GameData {
  score: BABYLON.int,
  matchCount: BABYLON.int,
  matchTimes: BABYLON.int,
  isHomerun: boolean,
  open: boolean
}

function App() {
  const [gameData, setGameData] = useState<GameData>({
    score: 0,
    matchCount: 0,
    matchTimes: 1,
    isHomerun: false,
    open: false
  })

  const classes = useStyles();
  const checkHomerun = useCallback((isHomerun: Boolean) => {
    let currentGameData = gameData
    if (isHomerun) {
      currentGameData.score++
      currentGameData.isHomerun = true
    }
    currentGameData.matchCount++

    let _isPlaying = true
    if (currentGameData.matchCount === MATCH_MAX * currentGameData.matchTimes) {
      if (currentGameData.isHomerun) {
        currentGameData.matchTimes++
        currentGameData.isHomerun = false
      } else {
        _isPlaying = false
      }
    }

    if (!_isPlaying)
      currentGameData.open = true

    setGameData({
      score: currentGameData.score,
      matchCount: currentGameData.matchCount,
      matchTimes: currentGameData.matchTimes,
      isHomerun: currentGameData.isHomerun,
      open: currentGameData.open
    })

    return !_isPlaying
  }, [gameData])

  const resetState = useCallback(() => {
    setGameData({
      score: 0,
      matchCount: 0,
      matchTimes: 1,
      isHomerun: false,
      open: false
    })
  }, [])

  const shareTweet = () => {
    let text = `${gameData.score}本のホームランを打ちました！！`
    if (gameData.score >= HOMERUN_KING) {
      text = `${gameData.score}本のホームランを打った君はホームラン王だ！！！！`
    } else if (gameData.score >= HOMERUN_KING / 2) {
      text = `${gameData.score}本のホームランを打ちました！！ホームラン王まであと少し！！`
    } else if (gameData.score === 0) {
      text = '1本も打てませんでした。。でも大丈夫。つくった人も打てない難易度だよ！'
    }
    window.open(`https://twitter.com/intent/tweet?text=${text}&hashtags=立体ホームラン競争,web1week&url=https://rittai-homerun.netlify.com`);
    setGameData({
      score: gameData.score,
      matchCount: gameData.matchCount,
      matchTimes: gameData.matchTimes,
      isHomerun: false,
      open: false
    })
  }

  const handleClose = () => {
    setGameData({
      score: gameData.score,
      matchCount: gameData.matchCount,
      matchTimes: gameData.matchTimes,
      isHomerun: false,
      open: false
    })
  };

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <div className={classes.root}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <div className={classes.title}>立体ホームラン競争</div>
          </Grid>
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs>
            <Box border={2} className={classes.gameInfo}>
              <p>スペースキー長押し: バットを構える</p>
              <p>スペースキーを離す: バットを振る</p>
              <br />
              <p>とおくから飛んでくるボールを<br />ひたすらバットで打ちまくろう！</p>
              <p>飛んでくるボールはぜんぶで {MATCH_MAX}球。<br />より多くのホームランをねらおう！</p>
              <p>{MATCH_MAX}球中 1本でもホームランが打てれば、連続してチャレンジできるぞ！</p>
              <p className={classes.gameHint}>たくさんホームランを打つと。。？</p>
            </Box>
          </Grid>
          <Grid item xs={7}>
            <Game playingCallback={checkHomerun} startCallback={resetState} />
          </Grid>
          <Grid item xs>
            <Box border={2} className={classes.gameInfo}>
              <p>のこり: {MATCH_MAX * gameData.matchTimes - gameData.matchCount}球</p>
              <p>ホームラン: {gameData.score}本</p>
            </Box>
            <br />
            <Box border={2} className={classes.gameInfo}>
              <p>スペシャルサンクス！</p>
              <ul>
                <li>音素材: <a href="https://on-jin.com/sound/spo.php?bunr=%E9%87%8E%E7%90%83&kate=%E3%82%B9%E3%83%9D%E3%83%BC%E3%83%84">音人さま</a></li>
                <li>フォント: <a href="http://itouhiro.hatenablog.com/entry/20130602/font">itouhiroさま</a></li>
                <li>ファビコン: <a href="https://hpgpixer.jp/image_icons/sports/icon_baseball_batter.html">PixelGaroさま</a></li>
              </ul>
              <p>つくった人: <a href="https://twitter.com/n1kaera">にかえら</a> </p>
            </Box>
          </Grid>
        </Grid>

        <Dialog
          open={gameData.open}
          onClose={handleClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">{"最後まで遊んでくれてありがとう！！"}</DialogTitle>
          <DialogContent>
            {gameData.score >= HOMERUN_KING ?
              <DialogContentText id="alert-dialog-description" className={classes.gameHint}>
                たのしんでくれたかな？みんなに特別な結果をシェアする？
                </DialogContentText> :
              <DialogContentText id="alert-dialog-description">
                たのしんでくれたかな？みんなに結果をシェアする？
                </DialogContentText>
            }
          </DialogContent>
          <DialogActions>
            <Button onClick={shareTweet} color="primary" autoFocus>
              する
            </Button>
            <Button onClick={handleClose} color="secondary">
              しない
          </Button>
          </DialogActions>
        </Dialog>
      </div>
    </MuiThemeProvider>
  );
}

export default App;
