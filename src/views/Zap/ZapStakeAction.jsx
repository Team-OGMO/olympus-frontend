import {
  Box,
  Button,
  FormControl,
  Grid,
  Icon,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Avatar,
  Typography,
  Dialog,
  DialogTitle,
  List,
  ListItem,
  ListItemAvatar,
  ButtonBase,
  IconButton,
  CardHeader,
  ListItemText,
  SvgIcon,
  CircularProgress,
} from "@material-ui/core";
import { changeZapTokenAllowance, executeZap, getTokenBalances, getZapTokenAllowance } from "src/slices/ZapSlice";
import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import ZapStakeHeader from "./ZapStakeHeader";
import { ReactComponent as DownIcon } from "../../assets/icons/arrow-down.svg";
import { ReactComponent as FirstStepIcon } from "../../assets/icons/step-1.svg";
import { ReactComponent as SecondStepIcon } from "../../assets/icons/step-2.svg";
import { ReactComponent as CompleteStepIcon } from "../../assets/icons/step-complete.svg";
import { useAppSelector, useWeb3Context } from "src/hooks";
import { ReactComponent as XIcon } from "../../assets/icons/x.svg";
import { ethers } from "ethers";

const iconStyle = { height: "24px", width: "24px", zIndex: 1 };
const viewBox = "-8 -12 48 48";

const buttonIconStyle = { height: "16px", width: "16px", marginInline: "6px" };

function ZapStakeAction(props) {
  const { address, connect, chainID, provider } = useWeb3Context();

  const dispatch = useDispatch();

  const tokens = useAppSelector(state => state.zap.balances);
  const isTokensLoading = useAppSelector(state => state.zap.balancesLoading);
  const isChangeAllowanceLoading = useAppSelector(state => state.zap.changeAllowanceLoading);
  const isExecuteZapLoading = useAppSelector(state => state.zap.stakeLoading);
  const isAppLoading = useAppSelector(state => state.app.loading);

  const [zapToken, setZapToken] = useState(null);
  const handleSelectZapToken = token => {
    setZapToken(token);
    handleClose();
  };

  const [modalOpen, setModalOpen] = useState(false);
  const handleOpen = () => {
    setModalOpen(true);
  };
  const handleClose = () => setModalOpen(false);

  const [inputQuantity, setInputQuantity] = useState("");
  const [outputQuantity, setOutputQuantity] = useState("");

  const ohmMarketPrice = useAppSelector(state => {
    return state.app.marketPrice;
  });

  const sOhmBalance = useAppSelector(state => Number(state.account?.balances?.sohm ?? 0.0));

  const exchangeRate = ohmMarketPrice / tokens[zapToken]?.price;

  const setZapTokenQuantity = q => {
    if (q == null || q === "") {
      setInputQuantity("");
      setOutputQuantity("");
      return;
    }
    const amount = Number(q);
    setInputQuantity(amount);
    setOutputQuantity(amount / exchangeRate);
  };

  const setOutputTokenQuantity = q => {
    if (q == null || q === "") {
      setInputQuantity("");
      setOutputQuantity("");
      return;
    }
    const amount = Number(q);
    setOutputQuantity(amount);
    setInputQuantity(amount * exchangeRate);
  };

  const inputTokenImages = useMemo(
    () =>
      Object.entries(tokens)
        .filter(token => token[0] !== "sohm")
        .map(token => token[1].img)
        .slice(0, 3),
    [tokens],
  );
  const currentTokenAllowance = useAppSelector(state => state.zap.allowances[zapToken]);
  const checkTokenAllowance = (tokenAddress, tokenSymbol) => {
    if (tokenAddress && tokenSymbol) {
      if (currentTokenAllowance == null) {
        dispatch(getZapTokenAllowance({ value: tokenAddress, address, action: tokenSymbol }));
      } else {
        return currentTokenAllowance;
      }
    } else {
      return false;
    }
  };

  const isTokenAllowanceFetched = currentTokenAllowance != null;
  const initialTokenAllowance = useMemo(
    () => checkTokenAllowance(tokens[zapToken]?.address, zapToken),
    [zapToken, isTokenAllowanceFetched],
  );

  const isAllowanceTxSuccess =
    initialTokenAllowance != currentTokenAllowance && initialTokenAllowance != null && currentTokenAllowance != null;

  const onSeekApproval = async () =>
    dispatch(
      changeZapTokenAllowance({
        address,
        value: tokens[zapToken]?.address,
        provider,
        action: zapToken,
      }),
    );

  const onZap = async () =>
    dispatch(
      executeZap({
        address,
        provider,
        slippage: 0.02,
        sellAmount: ethers.utils.parseUnits(inputQuantity.toString(), tokens[zapToken]?.decimals),
        tokenAddress: tokens[zapToken]?.address,
        networkID: chainID,
      }),
    );

  const downIcon = <SvgIcon component={DownIcon} viewBox={viewBox} style={iconStyle}></SvgIcon>;

  return (
    <>
      <div className="card-header">
        <Typography variant="h5">OlyZaps</Typography>
      </div>

      <ZapStakeHeader images={inputTokenImages} />

      <Typography>You Pay</Typography>
      <FormControl className="zap-input" variant="outlined" color="primary">
        <InputLabel htmlFor="amount-input"></InputLabel>
        {zapToken != null ? (
          <OutlinedInput
            id="zap-amount-input"
            type="number"
            placeholder="Enter an amount"
            className="zap-input"
            disabled={zapToken == null}
            value={inputQuantity}
            onChange={e => setZapTokenQuantity(e.target.value)}
            //   labelWidth={0}
            //   label="Hello"
            endAdornment={
              <InputAdornment position="end">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    minWidth: "60px",
                  }}
                >
                  {zapToken == null ? (
                    <ButtonBase onClick={handleOpen}>
                      <Box flexDirection="row" display="flex" alignItems="center">
                        <Typography>Select a Token</Typography>
                        {downIcon}
                      </Box>
                    </ButtonBase>
                  ) : (
                    <Box flexDirection="column" display="flex">
                      <Box flexDirection="row" display="flex" alignItems="center" justifyContent="flex-end">
                        <ButtonBase onClick={handleOpen}>
                          <Avatar src={tokens[zapToken].img} style={{ height: "30px", width: "30px" }} />
                          <Box width="10px" />
                          <Typography>{tokens[zapToken].symbol}</Typography>
                          {downIcon}
                        </ButtonBase>
                      </Box>

                      <Box height="5px" />
                      <Box flexDirection="row" display="flex" alignItems="center">
                        <Typography color="textSecondary">{`Your Balance ${tokens[zapToken].balance.toFixed(
                          2,
                        )}`}</Typography>
                        <Box width="10px" />
                        <ButtonBase onClick={() => setZapTokenQuantity(tokens[zapToken].balance)}>
                          <Typography>
                            <b>Max</b>
                          </Typography>
                        </ButtonBase>
                      </Box>
                    </Box>
                  )}
                </div>
              </InputAdornment>
            }
          />
        ) : (
          <Box className="zap-input">
            <Button variant="contained" className="zap-input" onClick={handleOpen} color="primary">
              <Box flexDirection="row" display="flex" alignItems="center" justifyContent="end" flexGrow={1}>
                <Typography>Select a Token</Typography>
                {downIcon}
              </Box>
            </Button>
          </Box>
        )}
      </FormControl>
      <Box marginY="10px" minHeight="25px" display="flex" justifyContent="center" alignItems="center">
        {downIcon}
      </Box>

      <Typography>You Get</Typography>
      <FormControl className="zap-input" variant="outlined" color="primary">
        <InputLabel htmlFor="amount-input"></InputLabel>
        <OutlinedInput
          id="zap-amount-output"
          type="number"
          placeholder="Enter an amount"
          className="zap-input"
          value={outputQuantity}
          disabled={zapToken == null}
          onChange={e => setOutputTokenQuantity(e.target.value)}
          labelWidth={0}
          endAdornment={
            <InputAdornment position="end">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  minWidth: "60px",
                }}
              >
                <Box flexDirection="column" display="flex">
                  <Box flexDirection="row" display="flex" alignItems="center" justifyContent="flex-end">
                    <Avatar
                      src="https://storage.googleapis.com/zapper-fi-assets/tokens/ethereum/0x04f2694c8fcee23e8fd0dfea1d4f5bb8c352111f.png"
                      style={{ height: "40px", width: "40px" }}
                    />
                    <Box width="10px" />
                    <Typography>sOHM</Typography>
                  </Box>
                  <Box flexDirection="row" display="flex" alignItems="center">
                    <Typography color="textSecondary">{`Your Balance ${sOhmBalance.toFixed(2)}`}</Typography>
                  </Box>
                </Box>
              </div>
            </InputAdornment>
          }
        />
      </FormControl>
      {initialTokenAllowance ? (
        <Button
          fullWidth
          className="zap-stake-button"
          variant="contained"
          color="primary"
          disabled={zapToken == null || isExecuteZapLoading}
          // disabled={isPendingTxn(pendingTransactions, approveTxnName)}
          onClick={onZap}
        >
          {/* {txnButtonText(pendingTransactions, approveTxnName, "Approve")} */}
          {isExecuteZapLoading ? "Pending..." : "Zap-Stake"}
        </Button>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={6} sm={6}>
            <Button
              fullWidth
              className="zap-stake-button"
              variant="contained"
              color="primary"
              disabled={zapToken == null || isTokensLoading || isAllowanceTxSuccess || isChangeAllowanceLoading}
              onClick={onSeekApproval}
            >
              {/* {txnButtonText(pendingTransactions, approveTxnName, "Approve")} */}
              <Box display="flex" flexDirection="row">
                {isAllowanceTxSuccess ? (
                  <>
                    <SvgIcon component={CompleteStepIcon} style={buttonIconStyle} viewBox={"0 0 16 16"} />
                    <Typography>Approved</Typography>
                  </>
                ) : (
                  <>
                    <SvgIcon component={FirstStepIcon} style={buttonIconStyle} viewBox={"0 0 16 16"} />
                    <Typography>{isChangeAllowanceLoading ? "Pending..." : "Approve"}</Typography>
                  </>
                )}
              </Box>
            </Button>
          </Grid>
          <Grid item xs={6} sm={6}>
            <Button
              fullWidth
              className="zap-stake-button"
              variant="contained"
              color="primary"
              disabled={!currentTokenAllowance || isExecuteZapLoading}
              // disabled={isPendingTxn(pendingTransactions, approveTxnName)}
              onClick={onZap}
            >
              {/* {txnButtonText(pendingTransactions, approveTxnName, "Approve")} */}
              <Box display="flex" flexDirection="row" alignItems="center">
                <SvgIcon component={SecondStepIcon} style={buttonIconStyle} viewBox={"0 0 16 16"} />

                <Typography>Zap-Stake</Typography>
              </Box>
            </Button>
          </Grid>
        </Grid>
      )}
      <Box justifyContent="space-between" flexDirection="row" display="flex" marginY="12px">
        <Typography>Max Slippage</Typography>
        <Typography>2.0%</Typography>
      </Box>
      <Box justifyContent="space-between" flexDirection="row" display="flex" marginY="12px">
        <Typography>Exchange Rate</Typography>
        <Typography>
          {zapToken == null ? "nil" : `${exchangeRate.toFixed(4)} ${tokens[zapToken].symbol}`} = 1 sOHM
        </Typography>
      </Box>

      <Dialog onClose={handleClose} open={modalOpen} keepMounted fullWidth maxWidth="xs" id="zap-select-token-modal">
        <DialogTitle>
          <Box display="flex" flexDirection="row" alignItems="center" justifyContent="space-between">
            <Button onClick={handleClose}>
              <SvgIcon component={XIcon} color="primary" />
            </Button>
            <Box paddingRight={6}>
              <Typography id="migration-modal-title" variant="h6" component="h2">
                Select Zap Token
              </Typography>
            </Box>
            <Box />
          </Box>
        </DialogTitle>
        {isTokensLoading || Object.entries(tokens).length == 0 ? null : (
          <List sx={{ pt: 0 }}>
            {Object.entries(tokens)
              .filter(token => !token[1].hide)
              .sort((tokenA, tokenB) => tokenB[1].balanceUSD - tokenA[1].balanceUSD)
              .map(token => (
                <ListItem button onClick={() => handleSelectZapToken(token[0])} key={token[1].symbol}>
                  <ListItemAvatar>
                    <Avatar src={token[1].img} />
                  </ListItemAvatar>
                  <ListItemText primary={token[1].symbol} />
                  <Box flexGrow={10} />
                  <ListItemText
                    style={{ primary: { justify: "center" } }}
                    primary={`$${token[1].balanceUSD.toFixed(2)}`}
                    secondary={token[1].balance.toFixed(4)}
                  />
                </ListItem>
              ))}
          </List>
        )}
      </Dialog>
    </>
  );
}

export default ZapStakeAction;