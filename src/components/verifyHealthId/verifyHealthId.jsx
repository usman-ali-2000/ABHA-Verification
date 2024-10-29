import React, {useEffect, useState} from "react";
import {
    getAuthModes,
    fetchPatientFromBahmniWithHealthId,
    getHealthIdStatus,
    saveTokenOnQRScan, searchHealthId, IsValidPHRAddress, fetchGlobalProperty
} from '../../api/hipServiceApi';
import AuthModes from '../auth-modes/authModes';
import Spinner from '../spinner/spinner';
import QrReader from 'react-qr-scanner';
import PatientDetails from '../patient-details/patientDetails';
import { FcWebcam } from 'react-icons/fc';
import './verifyHealthId.scss';
import DemoAuth from "../demo-auth/demoAuth";
import CreateHealthId from "../otp-verification/create-healthId";
import {enableHealthIdVerification, enableHealthIdVerificationThroughMobileNumber} from "../../api/constants";
import VerifyHealthIdThroughMobileNumber from "./verifyHealthIdThroughMobileNumber";

const VerifyHealthId = () => {
    const [id, setId] = useState('');
    const [authModes, setAuthModes] = useState([]);
    const supportedHealthIdAuthModes = ["MOBILE_OTP", "AADHAAR_OTP"];
    const [showAuthModes, setShowAuthModes] = useState(false);
    const [matchingPatientFound, setMatchingPatientFound] = useState(false);
    const [matchingpatientUuid, setMatchingPatientUuid] = useState('');
    const [healthIdIsVoided, setHealthIdIsVoided] = useState(false);
    const [errorHealthId, setErrorHealthId] = useState('');
    const [showError, setShowError] = useState(false);
    const [loader, setLoader] = useState(false);
    const [scanningStatus, setScanningStatus] = useState(false);
    const [ndhmDetails, setNdhmDetails] = useState({});
    const [back, setBack] = useState(false);
    const [isDemoAuth, setIsDemoAuth] = useState(false);
    const [isHealthIdCreated, setIsHealthIdCreated] = useState(false);
    let enableHealthIdVerify;
    const [isHealthNumberNotLinked, setIsHealthNumberNotLinked] = useState(false);
    const [error, setError] = useState('');
    const [isVerifyABHAThroughFetchModes, setIsVerifyABHAThroughFetchModes] = useState(false);
    const [isVerifyThroughABHASerice, setIsVerifyThroughABHASerice] = useState(false);
    const [isVerifyThroughMobileNumberEnabled, setIsVerifyThroughMobileNumberEnabled] = useState(false);
    const [isDisabled, setIsDisabled] = useState(false);
    const [isMobileOtpVerified, setIsMobileOtpVerified] = useState(false);

    function idOnChangeHandler(e) {
        setId(e.target.value);
    }

    async function verifyHealthId() {
        setError('');
        setLoader(true);
        setShowError(false);
        const matchingPatientId = await fetchPatientFromBahmniWithHealthId(id);
        const healthIdStatus = matchingPatientId.Error !== undefined ? await getHealthIdStatus(matchingPatientId.patientUuid) : false;
        if (matchingPatientId.Error === undefined) {
            if(healthIdStatus === true)
                setHealthIdIsVoided(true);
            else if (matchingPatientId.validPatient === true) {
                setMatchingPatientFound(true);
                setMatchingPatientUuid(matchingPatientId.patientUuid);
            } else {
                setMatchingPatientFound(false);
                await searchByHealthId();
            }
        } else {
            setShowError(true)
            setErrorHealthId(matchingPatientId.Error.message);
        }
        setLoader(false);
    }

    async function searchByHealthId() {
        const response = await searchHealthId(id);
        if(response.data !== undefined){
            setIsVerifyThroughABHASerice(true);
            if(response.data.status === "ACTIVE") {
                setShowAuthModes(true);
                setAuthModes(response.data.authMethods !== undefined ?
                    response.data.authMethods.filter(e => supportedHealthIdAuthModes.includes(e)) : []);
            }
            else
            {
                setShowError(true)
                setErrorHealthId("Health Id is not active");
            }
        }
        else {
            if(enableHealthIdVerify == null) {
                var resp = await fetchGlobalProperty(enableHealthIdVerification)
                if (resp.Error === undefined) {
                    enableHealthIdVerify = resp;
                }
            }
            if(enableHealthIdVerify && IsValidPHRAddress(id) && response.details[0].code === "HIS-1008"){
                setIsHealthNumberNotLinked(true)
            }
            else {
                setShowError(true)
                setErrorHealthId(response.details[0].message || response.message);
            }
        }
    }

    async function verify() {
        setError('');
        setLoader(true);
        const response = await getAuthModes(id);
        if (response.error !== undefined) {
            setError(response.error.message);
        }
        else {
            setShowAuthModes(true);
            setAuthModes(response.authModes);
            setIsVerifyABHAThroughFetchModes(true);
        }
        setLoader(false);
    }

    function getIfVaild(str){
        return (str && str !== '-') ? str : null;
    }

    function mapToNdhmDetails(scannedData) {
        var patient = JSON.parse(scannedData.text);
        var dob = patient['dob'].split(/[-/]+/).reverse().map(e => e !== "" ? e : "1");
        return {
            id: patient['phr'] || patient['hid'],
            gender: patient['gender'],
            name: patient['name'],
            dateOfBirth: dob.join('-'),
            isBirthDateEstimated: dob.length !== 3,
            address: {
                line: [getIfVaild(patient['address'])],
                district: getIfVaild(patient['dist name'] || patient['district_name']),
                state: getIfVaild(patient['state name']),
                pincode: getIfVaild(patient['pincode'])
            },
            identifiers: [
                {
                    "type": "MOBILE",
                    "value": patient['mobile']
                },
                {
                    "type": "HEALTH_NUMBER",
                    "value": getIfVaild(patient['hidn'])
                }
            ]
        };
    }

    async function handleScan(scannedData) {
        if (scannedData != null) {
            var ndhmDetails = mapToNdhmDetails(scannedData)
            setScanningStatus(false);
            const matchingPatientId = await fetchPatientFromBahmniWithHealthId(ndhmDetails.id);
            const healthIdStatus = matchingPatientId.Error !== undefined ? await getHealthIdStatus(matchingPatientId.patientUuid) : false;
            if (matchingPatientId.Error === undefined) {
                if (healthIdStatus === true)
                    setHealthIdIsVoided(true);
                else if (matchingPatientId.validPatient === true) {
                    setMatchingPatientFound(true);
                    setMatchingPatientUuid(matchingPatientId.patientUuid);
                } else {
                    setMatchingPatientFound(false);
                    setId(ndhmDetails.id);
                    setNdhmDetails(ndhmDetails);
                    setIsVerifyABHAThroughFetchModes(true);
                    await saveTokenOnQRScan(ndhmDetails);
                }
            } else {
                setShowError(true)
                setErrorHealthId(matchingPatientId.Error.message);
            }
        }
    }


    function redirectToPatientDashboard() {
        window.parent.postMessage({"patientUuid" : matchingpatientUuid}, "*");
    }

    useEffect(() => {
        if(back){
            setNdhmDetails({});
            setId('');
            setShowError(false);
            setShowAuthModes(false);
            setAuthModes([]);
            setMatchingPatientFound(false);
            setHealthIdIsVoided(false);
            setLoader(false);
            setBack(false);
            setIsDemoAuth(false);
            setError('');
            setIsMobileOtpVerified(false);
        }

    },[back])

    useEffect(async () => {
        var resp = await fetchGlobalProperty(enableHealthIdVerificationThroughMobileNumber)
        if (resp.Error === undefined) {
            setIsVerifyThroughMobileNumberEnabled(resp);
        }
    },[])

    return (
        <div>
        {!isDemoAuth && !checkIfNotNull(ndhmDetails) &&
            <div>
                {!isMobileOtpVerified &&
                <div>
                    <div className="verify-health-id">
                        <label htmlFor="healthId" className="label">Enter ABHA Number/ABHA Address: </label>
                        <div className="verify-health-id-input-btn">
                            <div className="verify-health-id-input">
                                <input type="text" id="healthId" name="healthId" value={id} onChange={idOnChangeHandler} />
                            </div>
                            <button name="verify-btn" type="button" onClick={verifyHealthId} disabled={showAuthModes || checkIfNotNull(ndhmDetails) || isDisabled}>Verify</button>
                            {showError && <h6 className="error">{errorHealthId}</h6>}
                        </div>
                    </div>
                    <div className="alternative-text">
                        OR
                    </div>
                    <div className="qr-code-scanner">
                        <button name="scan-btn" type="button" onClick={()=> setScanningStatus(!scanningStatus)} disabled={showAuthModes || checkIfNotNull(ndhmDetails) || isDisabled}>Scan Patient's QR code <span id="cam-icon"><FcWebcam /></span></button>
                        {scanningStatus && <QrReader
                            delay={10}
                            onScan={handleScan}
                            style={{ width: '60%', margin: '50px' }}
                        />}
                    </div>
                </div>}
                {isVerifyThroughMobileNumberEnabled &&
                <div>
                    {!isMobileOtpVerified && <div className="alternative-text">
                        OR
                    </div>}
                    <VerifyHealthIdThroughMobileNumber isDisabled={showAuthModes} setIsDisabled={setIsDisabled} setIsMobileOtpVerified={setIsMobileOtpVerified}
                                                       ndhmDetails={ndhmDetails} setNdhmDetails={setNdhmDetails} setBack={setBack}/>
                </div>}
                {matchingPatientFound && <div className="patient-existed" onClick={redirectToPatientDashboard}>
                    Matching record with Health ID/PHR Address found
                </div>}
                {healthIdIsVoided && <div className="id-deactivated">
                    Health ID is deactivated
                </div>}
                {!showAuthModes && isHealthNumberNotLinked && <div>
                    <div className="note health-id">
                        Health Id doesn't have health Number linked.
                        Click on proceed to authenticate with only healthId or you can create new ABHA Number
                    </div>
                    <div className="proceed-button">
                        <button name="proceed-btn" type="button" onClick={verify}>Proceed</button>
                    </div>
                    {error !== '' && <h6 className="error">{error}</h6>}
                </div> }
                {loader && <Spinner />}
                {showAuthModes && <AuthModes id={id} authModes={authModes} ndhmDetails={ndhmDetails} setNdhmDetails={setNdhmDetails} setIsDemoAuth={setIsDemoAuth} isHealthNumberNotLinked={isHealthNumberNotLinked}/>}
            </div>}
            {isDemoAuth && !checkIfNotNull(ndhmDetails) && <DemoAuth id={id} ndhmDetails={ndhmDetails} setNdhmDetails={setNdhmDetails} setBack={setBack}/>}
            {(isVerifyThroughABHASerice || isVerifyThroughMobileNumberEnabled) && checkIfNotNull(ndhmDetails) && ndhmDetails.id === undefined  && <CreateHealthId ndhmDetails={ndhmDetails} setNdhmDetails={setNdhmDetails} setIsHealthIdCreated={setIsHealthIdCreated} />}
            {!matchingPatientFound && !healthIdIsVoided && checkIfNotNull(ndhmDetails) && (ndhmDetails.id !== undefined || isHealthIdCreated || isVerifyABHAThroughFetchModes)
             && <PatientDetails ndhmDetails={ndhmDetails} id={id} setBack={setBack} isVerifyABHAThroughFetchModes={isVerifyABHAThroughFetchModes || !isHealthIdCreated}/>}
        </div>
    );
}

export const checkIfNotNull = (patient) => {
    return JSON.stringify(patient) !== JSON.stringify({})
}

export default VerifyHealthId;
