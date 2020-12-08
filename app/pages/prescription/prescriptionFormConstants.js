import React from 'react';
import { Trans } from 'react-i18next';
import { Link } from 'rebass/styled-components';
import compact from 'lodash/compact';
import isEmpty from 'lodash/isEmpty';
import isFinite from 'lodash/isFinite';
import get from 'lodash/get';
import map from 'lodash/map';
import max from 'lodash/max';
import min from 'lodash/min';
import filter from 'lodash/filter';
import includes from 'lodash/includes';

import i18next from '../../core/language';
import { MGDL_UNITS, MMOLL_UNITS } from '../../core/constants';
import utils from '../../core/utils';
import { getFloatFromUnitsAndNanos } from '../../core/data';

const t = i18next.t.bind(i18next);

export const dateFormat = 'YYYY-MM-DD';
export const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;

export const revisionStates = ['draft', 'pending', 'submitted'];

export const deviceIdMap = {
  dexcomG6: 'd25c3f1b-a2e8-44e2-b3a3-fd07806fc245',
  omnipodHorizon: '6678c377-928c-49b3-84c1-19e2dafaff8d',
};

export const validDeviceIds = {
  cgms: [
    deviceIdMap.dexcomG6,
  ],
  pumps: [
    deviceIdMap.omnipodHorizon,
  ],
};

export const deviceExtraInfo = {
  [deviceIdMap.dexcomG6]: (
    <Trans>
      Find information on how to prescribe Dexcom G6 sensors and transmitters and more <Link href="#">here</Link>.
    </Trans>
  ),
  [deviceIdMap.omnipodHorizon]: (
    <Trans>
      Find information on how to prescribe Omnipod products <Link href="#">here</Link>.
    </Trans>
  ),
};

export const pumpDeviceOptions = ({ pumps } = {}) => map(
  filter(pumps, pump => includes(validDeviceIds.pumps, pump.id)),
  pump => ({
    value: pump.id,
    label: t('{{displayName}}', { displayName: pump.displayName }),
    extraInfo: deviceExtraInfo[pump.id] || null,
  }),
);

export const cgmDeviceOptions = ({ cgms } = {}) => map(
  filter(cgms, cgm => includes(validDeviceIds.cgms, cgm.id)),
  cgm => ({
    value: cgm.id,
    label: t('{{displayName}}', { displayName: cgm.displayName }),
    extraInfo: deviceExtraInfo[cgm.id] || null,
  }),
);

export const defaultUnits = {
  basalRate: 'Units/hour',
  bloodGlucose: MGDL_UNITS,
  glucoseSafetyLimit: MGDL_UNITS,
  bolusAmount: 'Units',
  insulinCarbRatio: 'g/U',
};

export const getPumpGuardrail = (pump, path, fallbackValue) => getFloatFromUnitsAndNanos(get(pump, `guardRails.${path}`)) || fallbackValue;

export const getBgInTargetUnits = (bgValue, bgUnits, targetUnits) => {
  if (bgUnits === targetUnits || !isFinite(bgValue)) return bgValue;
  return utils.roundBgTarget(utils.translateBg(bgValue, targetUnits), targetUnits);
};

export const getBgStepInTargetUnits = (stepValue, stepUnits, targetUnits) => {
  if (stepUnits === targetUnits || !isFinite(stepValue)) return stepValue;
  return (stepUnits === MGDL_UNITS)
    ? stepValue * 0.1
    : stepValue * 10;
};

export const pumpRanges = (pump, bgUnits = defaultUnits.bloodGlucose, values) => {
  const ranges = {
    basalRate: {
      min: getPumpGuardrail(pump, 'basalRates.absoluteBounds.minimum', 0),
      max: getPumpGuardrail(pump, 'basalRates.absoluteBounds.maximum', 35),
      step: getPumpGuardrail(pump, 'basalRates.absoluteBounds.increment', 0.05),
    }, // will need to enforce step in case user types in invalid value
    basalRateMaximum: {
      min: getPumpGuardrail(pump, 'basalRateMaximum.absoluteBounds.minimum', 0),
      max: getPumpGuardrail(pump, 'basalRateMaximum.absoluteBounds.maximum', 35),
      step: getPumpGuardrail(pump, 'basalRateMaximum.absoluteBounds.increment', 0.25),
    },
    bloodGlucoseTarget: {
      min: max(compact([
        getBgInTargetUnits(getPumpGuardrail(pump, 'correctionRange.absoluteBounds.minimum', 87), MGDL_UNITS, bgUnits),
        get(values, 'initialSettings.glucoseSafetyLimit'),
      ])),
      max: getBgInTargetUnits(getPumpGuardrail(pump, 'correctionRange.absoluteBounds.maximum', 180), MGDL_UNITS, bgUnits),
      step: getBgStepInTargetUnits(getPumpGuardrail(pump, 'correctionRange.absoluteBounds.increment', 1), MGDL_UNITS, bgUnits),
    },
    bloodGlucoseTargetPhysicalActivity: {
      min: max(compact([
        getBgInTargetUnits(getPumpGuardrail(pump, 'workoutCorrectionRange.absoluteBounds.minimum', 85), MGDL_UNITS, bgUnits),
        get(values, 'initialSettings.glucoseSafetyLimit'),
      ])),
      max: getBgInTargetUnits(getPumpGuardrail(pump, 'workoutCorrectionRange.absoluteBounds.maximum', 250), MGDL_UNITS, bgUnits),
      step: getBgStepInTargetUnits(getPumpGuardrail(pump, 'workoutCorrectionRange.absoluteBounds.increment', 1), MGDL_UNITS, bgUnits),
    },
    bloodGlucoseTargetPreprandial: {
      min: max(compact([
        getBgInTargetUnits(getPumpGuardrail(pump, 'glucoseSafetyLimit.absoluteBounds.minimum', 67), MGDL_UNITS, bgUnits),
        get(values, 'initialSettings.glucoseSafetyLimit'),
      ])),
      max: getBgInTargetUnits(getPumpGuardrail(pump, 'preprandialCorrectionRange.absoluteBounds.maximum', 130), MGDL_UNITS, bgUnits),
      step: getBgStepInTargetUnits(getPumpGuardrail(pump, 'preprandialCorrectionRange.absoluteBounds.increment', 1), MGDL_UNITS, bgUnits),
    },
    bolusAmountMaximum: {
      min: getPumpGuardrail(pump, 'bolusAmountMaximum.absoluteBounds.minimum', 0),
      max: getPumpGuardrail(pump, 'bolusAmountMaximum.absoluteBounds.maximum', 30),
      step: getPumpGuardrail(pump, 'bolusAmountMaximum.absoluteBounds.increment', 1),
    },
    carbRatio: {
      min: getPumpGuardrail(pump, 'carbohydrateRatio.absoluteBounds.minimum', 1),
      max: getPumpGuardrail(pump, 'carbohydrateRatio.absoluteBounds.maximum', 150),
      step: getPumpGuardrail(pump, 'carbohydrateRatio.absoluteBounds.increment', 1),
    },
    insulinSensitivityFactor: {
      min: getBgInTargetUnits(getPumpGuardrail(pump, 'insulinSensitivity.absoluteBounds.minimum', 10), MGDL_UNITS, bgUnits),
      max: getBgInTargetUnits(getPumpGuardrail(pump, 'insulinSensitivity.absoluteBounds.maximum', 500), MGDL_UNITS, bgUnits),
      step: getBgStepInTargetUnits(getPumpGuardrail(pump, 'insulinSensitivity.absoluteBounds.increment', 1), MGDL_UNITS, bgUnits),
    },
    glucoseSafetyLimit: {
      min: getBgInTargetUnits(getPumpGuardrail(pump, 'glucoseSafetyLimit.absoluteBounds.minimum', 67), MGDL_UNITS, bgUnits),
      max: min(compact([
        getBgInTargetUnits(getPumpGuardrail(pump, 'glucoseSafetyLimit.absoluteBounds.maximum', 110), MGDL_UNITS, bgUnits),
        get(values, 'initialSettings.bloodGlucoseTargetPhysicalActivity.low'),
        get(values, 'initialSettings.bloodGlucoseTargetPreprandial.low'),
        min(map(get(values, 'initialSettings.bloodGlucoseTargetSchedule'), 'low')),
      ])),
      step: getBgStepInTargetUnits(getPumpGuardrail(pump, 'glucoseSafetyLimit.absoluteBounds.increment', 1), MGDL_UNITS, bgUnits),
    },
  };

  return ranges;
};

export const warningThresholds = (pump, bgUnits = defaultUnits.bloodGlucose, values) => {
  const lowWarning = t('The value you have chosen is lower than Tidepool generally recommends.');
  const highWarning = t('The value you have chosen is higher than Tidepool generally recommends.');

  const maxBasalRate = max(map(values.initialSettings.basalRateSchedule, 'rate'));
  const basalRateMaximumWarning = t('Tidepool recommends that your maximum basal rate does not exceed 6 times your highest scheduled basal rate of {{value}} U/hr.', {
    value: maxBasalRate,
  });

  const bloodGlucoseTargetSchedules = get(values, 'initialSettings.bloodGlucoseTargetSchedule');
  const bloodGlucoseTargetSchedulesMin = min(compact(map(bloodGlucoseTargetSchedules, 'low')));
  const bloodGlucoseTargetSchedulesMax = min(compact(map(bloodGlucoseTargetSchedules, 'high')));

  let bloodGlucoseTargetSchedulesExtentsText = (isFinite(bloodGlucoseTargetSchedulesMin) && isFinite(bloodGlucoseTargetSchedulesMax))
    ? t(' ({{bloodGlucoseTargetSchedulesMin}}-{{bloodGlucoseTargetSchedulesMax}} {{bgUnits}})', {
      bloodGlucoseTargetSchedulesMin,
      bloodGlucoseTargetSchedulesMax,
      bgUnits,
    })
    : '';

  const thresholds = {
    basalRateMaximum: {
      high: { value: maxBasalRate * 6 + 0.01, message: basalRateMaximumWarning }
    },
    bloodGlucoseTarget: {
      low: {
        value: getBgInTargetUnits(getPumpGuardrail(pump, 'correctionRange.recommendedBounds.minimum', 101), MGDL_UNITS, bgUnits),
        message: lowWarning,
      },
      high: {
        value: getBgInTargetUnits(getPumpGuardrail(pump, 'correctionRange.recommendedBounds.maximum', 115), MGDL_UNITS, bgUnits),
        message: highWarning,
      },
    },
    bloodGlucoseTargetPhysicalActivity: {
      low: isFinite(bloodGlucoseTargetSchedulesMax) ? {
        value: bloodGlucoseTargetSchedulesMax,
        message: t(
          'Tidepool generally recommends a workout range higher than your normal correction range{{bloodGlucoseTargetSchedulesExtentsText}}.',
          { bloodGlucoseTargetSchedulesExtentsText }
        ),
      } : undefined,
      high: {
        value: getBgInTargetUnits(getPumpGuardrail(pump, 'workoutCorrectionRange.recommendedBounds.maximum', 180), MGDL_UNITS, bgUnits),
        message: highWarning,
      }
    },
    bloodGlucoseTargetPreprandial: {
      high: isFinite(bloodGlucoseTargetSchedulesMin) ? {
        value: bloodGlucoseTargetSchedulesMin,
        message: t(
          'Tidepool generally recommends a pre-meal range lower than your normal correction range{{bloodGlucoseTargetSchedulesExtentsText}}.',
          { bloodGlucoseTargetSchedulesExtentsText }
        ),
      } : undefined,
    },
    bolusAmountMaximum: {
      low: {
        value: getPumpGuardrail(pump, 'bolusAmountMaximum.recommendedBounds.minimum', 0),
        message: lowWarning,
      },
      high: {
        value: getPumpGuardrail(pump, 'bolusAmountMaximum.recommendedBounds.maximum', 20),
        message: highWarning,
      },
    },
    carbRatio: {
      low: {
        value: getPumpGuardrail(pump, 'carbohydrateRatio.recommendedBounds.minimum', 3),
        message: lowWarning,
      },
      high: {
        value: getPumpGuardrail(pump, 'carbohydrateRatio.recommendedBounds.maximum', 28),
        message: highWarning,
      },
    },
    insulinSensitivityFactor: {
      low: {
        value: getPumpGuardrail(pump, 'insulinSensitivity.recommendedBounds.minimum', 16),
        message: lowWarning,
      },
      high: {
        value: getPumpGuardrail(pump, 'insulinSensitivity.recommendedBounds.maximum', 399),
        message: highWarning,
      },
    },
    glucoseSafetyLimit: {
      low: {
        value: getBgInTargetUnits(getPumpGuardrail(pump, 'glucoseSafetyLimit.recommendedBounds.minimum', 74), MGDL_UNITS, bgUnits),
        message: lowWarning,
      },
      high: {
        value: getBgInTargetUnits(getPumpGuardrail(pump, 'glucoseSafetyLimit.recommendedBounds.maximum', 80), MGDL_UNITS, bgUnits),
        message: highWarning,
      },
    },
  };

  return thresholds;
};

export const typeOptions = [
  { value: 'patient', label: t('Patient') },
  { value: 'caregiver', label: t('Patient and caregiver') },
];

export const sexOptions = [
  { value: 'female', label: t('Female') },
  { value: 'male', label: t('Male') },
  { value: 'undisclosed', label: t('Prefer not to specify') },
];

export const trainingOptions = [
  { value: 'inPerson', label: t('Yes, Patient requires in-person CPT training') },
  { value: 'inModule', label: t('No, Patient can self start with Tidepool Loop in-app tutorial') },
];

export const insulinModelOptions = [
  { value: 'rapidAdult', label: t('Rapid Acting - Adult') },
  { value: 'rapidChild', label: t('Rapid Acting - Child') },
];

export const validCountryCodes = [1];

export const stepValidationFields = [
  [
    ['accountType'],
    ['firstName', 'lastName', 'birthday'],
    ['caregiverFirstName', 'caregiverLastName', 'email', 'emailConfirm'],
  ],
  [
    ['phoneNumber.number'],
    ['mrn'],
    ['sex'],
    ['initialSettings.pumpId', 'initialSettings.cgmId'],
  ],
  [
    [
      'training',
      'initialSettings.glucoseSafetyLimit',
      'initialSettings.insulinModel',
      'initialSettings.basalRateMaximum.value',
      'initialSettings.bolusAmountMaximum.value',
      'initialSettings.bloodGlucoseTargetSchedule',
      'initialSettings.bloodGlucoseTargetPhysicalActivity',
      'initialSettings.bloodGlucoseTargetPreprandial',
      'initialSettings.basalRateSchedule',
      'initialSettings.carbohydrateRatioSchedule',
      'initialSettings.insulinSensitivitySchedule',
    ],
  ],
  [
    ['therapySettingsReviewed'],
  ],
];
