import React from 'react';
import './progress.css';

class Progress extends React.Component {
    constructor(props) {
        super(props);

        const { radius, stroke } = this.props;
    
        this.normalizedRadius = radius - stroke * 2;
        this.circumference = this.normalizedRadius * 2 * Math.PI;
    }

    render() {
        const { radius, stroke, progress } = this.props;

        const strokeDashoffset = this.circumference - progress / 100 * this.circumference;
        const strokeDashoffset2 = this.circumference - 100 / 100 * this.circumference;

        return (
            <svg
                height={radius * 2}
                width={radius * 2}
            >
                <circle
                className="circleFull"
                stroke="white"
                fill="transparent"
                strokeWidth={ stroke }
                strokeDasharray={ this.circumference + ' ' + this.circumference }
                style={ { strokeDashoffset2 } }
                r={ this.normalizedRadius }
                cx={ radius }
                cy={ radius }
                />
                <circle
                className="circleFill"
                stroke="#222"
                fill="transparent"
                strokeWidth={ stroke }
                strokeDasharray={ this.circumference + ' ' + this.circumference }
                style={ { strokeDashoffset } }
                r={ this.normalizedRadius }
                cx={ radius }
                cy={ radius }
                />
            </svg>
        )
    }
}

export default Progress;