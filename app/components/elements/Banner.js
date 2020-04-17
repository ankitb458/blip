import React from 'react';
import PropTypes from 'prop-types';
import { Flex, Text, Box, BoxProps } from 'rebass/styled-components';
import CloseIcon from '@material-ui/icons/Close';

const Banner = (props) => {
  const { label, variant, message, dismissable, ...themeProps } = props;
  let close = null;

  if (dismissable) {
    close = (
      <span style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 0,
      }}>
        <CloseIcon style={{ fontSize: 14, float: 'right' }} />
      </span>
    );
  }

  return (
    <Flex
      aria-label={label}
      {...themeProps}
      variant={`banners.${variant}`}>
      <Box width={'94%'} sx={{ display: 'flex', justifyContent: 'center' }}>
        {props.children}
        <Text className="message">{message}</Text>
      </Box>
      <Box width={'3%'} px={0}>
        {close}
      </Box>
    </Flex>
  );
};

Banner.propTypes = {
  ...BoxProps,
  message: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(['default', 'warning', 'danger']),
  label: PropTypes.string.isRequired,
  dismissable: PropTypes.bool,
};

Banner.defaultProps = {
  message: 'Doggo floofer pat pat mlem',
  variant: 'default',
  label: 'banner',
  dismissable: false,
};

export default Banner;
