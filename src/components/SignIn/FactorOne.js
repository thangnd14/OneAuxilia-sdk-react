import React, { Fragment, useEffect, useState } from "react"
import useStore from "../Context"
import { apiCore } from "../../api"
import InputOtp from "../InputOtp"
import EmailLink from "../EmailLink"
import { stepStatus, strategieCode } from "../../lib/const"
import { getAuthStrategies, getOtpByParams } from "../../lib/function"
import { Button } from "../ui"

function isMobile() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

export default function FactorOne({ children, onChangeStep }) {
  const { setLogin, setLoaded, firstSignIn, user_general_setting } = useStore()
  const strategies = getAuthStrategies(user_general_setting.authentication_strategies)
  const strategie = strategies[0]
  var [otp_code, email] = getOtpByParams()
  const [otp, setOtp] = useState()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function onOk() {
    try {
      setLoaded(false)
      setLoading(true)
      const body = {
        strategy: otp_code ? strategieCode.EMAIL_LINK : strategie,
        email_or_phone: email || firstSignIn.email,
        code: otp_code ? otp_code : otp
      }
      const { data } = await apiCore.attemptFirstfactor3(body)

      if (data?.user?.status === stepStatus.COMPLETED) {
        setLogin(data)
      } else {
        onChangeStep(3)
      }
    } catch (error) {
      console.log(error)
      setError("Incorrect code")
    } finally {
      setLoading(false)
    }
  }

  function onChangeOtp(value) {
    setOtp(value)
  }

  async function fetch() {
    try {
      const dataBody = {
        strategy: strategie,
        email_or_phone: firstSignIn.email
      }
      if (strategie === strategieCode.EMAIL_LINK) {
        dataBody.redirect_url = window.location.href
        dataBody.url = window.location.href
      }
      await apiCore.prepareFirstfactor2(dataBody)
    } catch (error) {
      console.log({ error })
    }
  }

  function onBack() {
    onChangeStep(1)
  }

  useEffect(() => {
    if (strategies.length > 0) {
      if (otp_code) {
        if (isMobile) {
          const bodyData = {
            strategy: otp_code ? strategieCode.EMAIL_LINK : strategie,
            email_or_phone: email || firstSignIn.email,
            code: otp_code ? otp_code : otp
          }
          const params = new URLSearchParams(bodyData).toString()
          window.open(`arpxhaoqjvb2://loginWithEmailLink?${params}`)
          return
        } else {
          onOk(otp_code)
        }
      } else {
        fetch()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user_general_setting])
  //fix email link
  return (
    <Fragment>
      {strategie === strategieCode.EMAIL_LINK ? (
        <EmailLink onResend={fetch} onBack={onBack} />
      ) : (
        <Fragment>
          <InputOtp
            onChange={onChangeOtp}
            value={otp}
            error={error}
            onResend={fetch}
            step={2}
            strategie={strategie}
            firstSignIn={firstSignIn}
          />
          <div className="ox_mb_8"></div>
          <Button type="primary" onClick={onOk} loading={loading} isIconNext={true} isSubmit={true}>
            Continue
          </Button>
          <div className="ox_mb_4"></div>
          <div className="ox_link" onClick={onBack}>
            Back
          </div>
        </Fragment>
      )}
    </Fragment>
  )
}
