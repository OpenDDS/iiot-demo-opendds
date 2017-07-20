import React, {PropTypes as t} from 'react';
import {Button, Modal} from 'react-bootstrap';
import './dialog.css';

const Dialog = ({
  buttons = [], children = [], className, kind, onClose, show, size, title
}) => {
  // If there is a single child, put it in an array
  // so we can treat all uses the same.
  if (!Array.isArray(children)) children = [children];

  // Make a copy so we don't modify the original.
  const buttonList = Object.assign([], buttons);

  // If buttons were specfied using DialogButton child elements ...
  for (const child of children) {
    const name = !child ? null :
      (child.type && child.type.name) || child.type;
    if (name === 'DialogButton') buttonList.push(child.props);
  }

  const buttonElements =
    buttonList.map(btn => {
      const {isDisabled, label, onClick} = btn;
      const disabled = isDisabled && isDisabled();
      return (
        <Button
          disabled={disabled}
          key={label}
          onClick={onClick}
        >
          {label}
        </Button>
      );
    });

  return (
    <Modal
      bsSize={size}
      className={`dialog ${className} ${kind}`}
      onHide={onClose}
      show={show}
    >
      {
        title ?
          <Modal.Header closeButton>
            <Modal.Title>{title}</Modal.Title>
          </Modal.Header> :
          null
      }
      <Modal.Body>
        {children}
      </Modal.Body>
      <Modal.Footer>
        {buttonElements}
      </Modal.Footer>
    </Modal>
  );
};

Dialog.propTypes = {
  buttons: t.arrayOf(t.shape({
    isDisabled: t.func,
    label: t.string.isRequired,
    onClick: t.func.isRequired
  })),
  children: t.oneOfType([t.arrayOf(t.node), t.node, t.string]),
  className: t.string,
  kind: t.string,
  onClose: t.func,
  show: t.bool.isRequired,
  size: t.oneOf(['large', 'lg', 'sm', 'small']), // modal width
  title: t.string
};

export default Dialog;
