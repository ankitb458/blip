import * as dataUtils from '../../../../app/core/data';

/* global describe */
/* global it */
/* global expect */

describe('isMissingBasicsData', () => {
  const emptyAggregations = {
    basals: { byDate: [] },
    boluses: { byDate: [] },
    fingersticks: {
      calibration: { byDate: [] },
      smbg: { byDate: [] },
    },
    siteChanges: { byDate: [] },
  }

  it('should return `true` for a data set missing expected `byDate` aggregations', () => {
    expect(dataUtils.isMissingBasicsData(emptyAggregations)).to.be.true;
  });

  it('should return `false` if any of the `byDate` aggregations are not empty', () => {
    const hasBasals = { ...emptyAggregations, basals: { byDate: ['foo'] } };
    const hasBoluses = { ...emptyAggregations, boluses: { byDate: ['foo'] } };
    const hasSiteChanges = { ...emptyAggregations, siteChanges: { byDate: ['foo'] } };
    const hasSmbgs = { ...emptyAggregations, fingersticks: { smbg: { byDate: ['foo'] } } };
    const hasCalibrations = { ...emptyAggregations, fingersticks: { calibration: { byDate: ['foo'] } } };

    expect(dataUtils.isMissingBasicsData(hasBasals)).to.be.false;
    expect(dataUtils.isMissingBasicsData(hasBoluses)).to.be.false;
    expect(dataUtils.isMissingBasicsData(hasSiteChanges)).to.be.false;
    expect(dataUtils.isMissingBasicsData(hasSmbgs)).to.be.false;
    expect(dataUtils.isMissingBasicsData(hasCalibrations)).to.be.false;
  });
});

describe('getFloatFromUnitsAndNanos', () => {
  it('should return a float from an object with units and nanos integers', () => {
    expect(dataUtils.getFloatFromUnitsAndNanos({ units: 5, nanos: 500000000 })).to.equal(5.5);
    expect(dataUtils.getFloatFromUnitsAndNanos({ units: 0, nanos: 35000000 })).to.equal(0.035);
  });
});
