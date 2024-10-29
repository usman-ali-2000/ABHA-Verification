import React, { useState } from "react";
import {authInit, fetchGlobalProperty, healthIdAuthInit} from '../../api/hipServiceApi';
import OtpVerification from '../otp-verification/otpVerification';
import Spinner from '../spinner/spinner';
import {checkIfNotNull} from "../verifyHealthId/verifyHealthId";
import DirectAuth from "../direct-auth/directAuth";
import {enableDemographics} from "../../api/constants";

const AuthModes = (props) => {
    const [selectedAuthMode, setSelectedAuthMode] = useState('');
    const [showOtpField, setShowOtpField] = useState(false);
    const [errorHealthId, setErrorHealthId] = useState('');
    const [showError, setShowError] = useState(false);
    const [loader, setLoader] = useState(false);
    const [ndhmDetails, setNdhmDetails] = [props.ndhmDetails,props.setNdhmDetails];
    const [isDirectAuth, setIsDirectAuth] = useState(false);
    let isDemoAuthEnabled = false;

    const id = props.id;
    const authModes = props.authModes;
    let authModesList = authModes !== undefined && authModes.length > 0 && authModes.map((item, i) => {
        return (
            <option key={i} value={item}>{item}</option>
        )
    });

    function onAuthModeSelected(e) {
        setSelectedAuthMode(e.target.value);
    }

    async function authenticate() {
        setLoader(true);
        if(!props.isHealthNumberNotLinked){
            setShowError(false);
            const response = await healthIdAuthInit(id, selectedAuthMode);
            if (response.data !== undefined) {
                setShowOtpField(true);
            }
            else {
                setShowError(true)
                setErrorHealthId(response.details[0].message || response.message);
            }
        }
        else {
            const response = await fetchGlobalProperty(enableDemographics);
            setLoader(true);
            if(response.Error === undefined && response !== ""){
               isDemoAuthEnabled = response;
            }
            if (checkIfAuthModeSupported()) {
                setShowError(false)
                const response = await authInit(id, selectedAuthMode);
                if (response.error !== undefined) {
                    setShowError(true)
                    setErrorHealthId(response.error.message);
                }
                else {
                    setIsDirectAuth(selectedAuthMode === "DIRECT");
                    props.setIsDemoAuth(selectedAuthMode === "DEMOGRAPHICS")
                    setShowOtpField(true);
                }
            } else {
                setErrorHealthId("The selected Authentication Mode is currently not supported!");
                setShowError(true);
            }
        }

        setLoader(false);
    }

    function checkIfAuthModeSupported(){
        if((selectedAuthMode === 'DEMOGRAPHICS' && !isDemoAuthEnabled) || selectedAuthMode === 'PASSWORD') {
            return false;
        }
        return true;
    }


    return (
        <div>
            {!checkIfNotNull(ndhmDetails) && <div className="auth-modes">
                <label htmlFor="auth-modes">Preferred mode of Authentication</label>
                <div className="auth-modes-select-btn">
                    <div className="auth-modes-select">
                        <select id="auth-modes" onChange={onAuthModeSelected}>
                            <option>Select auth mode..</option>
                            {authModesList}
                        </select>
                    </div>
                    <button type="button" disabled={showOtpField || isDirectAuth} onClick={authenticate}>Authenticate</button>
                    {showError && <h6 className="error">{errorHealthId}</h6>}
                </div>
            </div>}
            {loader && <Spinner />}
            {isDirectAuth && <DirectAuth healthId={id} ndhmDetails={ndhmDetails} setNdhmDetails={setNdhmDetails}/>}
            {!isDirectAuth && showOtpField && <OtpVerification id={id} selectedAuthMode={selectedAuthMode} ndhmDetails={ndhmDetails} setNdhmDetails={setNdhmDetails} isHealthNumberNotLinked={props.isHealthNumberNotLinked}/>}
        </div>
    );
}
export default AuthModes;
