import React from "react";
import './modal.css';

class Modal extends React.Component {
    constructor(props) {
        super(props);

        this.close = this.close.bind(this);
        this.callback = this.callback.bind(this);
    }

    close() {
        this.props.onClose();
    }

    callback() {
        this.props.callback();
        this.props.onClose();
    }

    render() {
        if(!this.props.show) {
            return null;
        }
        return (
            <div className="modal">
                <div className="modal-background">
                </div>
                <div className="modal-wrapper">
                
                    <div className="modal-panel">
                        <div className="modal-title">
                            {this.props.ops.title}
                        </div>
                        <div className="modal-content">
                            {this.props.ops.content}
                        </div>
                        <div className="modal-btns">
                            <div className="modal-confirm" onClick={this.callback}>
                                Yes
                            </div>
                            <div className="modal-cancel" onClick={this.close}>
                                No
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Modal;