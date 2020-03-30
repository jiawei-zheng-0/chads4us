import React from 'react';
import collegeIMG from '../../assets/images/college.jpg'
import collegeLogo from '../../assets/images/collegelogo.jpg';

import './collegeResult.scss';


class CollegeResult extends React.Component {
    constructor(props) {
        super(props);
        // console.log(this.props);
    }

    componentDidMount() {

    }

    render() {
        return(
            <div className="collegeResult">
                <div className="collegeResultWrap">
                    <div className="collegeHeading">
                        <img className="collegeImage" src={collegeIMG} alt="College IMG not found"></img>
                        <div className="collegeHeadingText">
                            <div className="collegeLogoWrap">
                                <img className="collegeLogo" src={collegeLogo} alt="LOGO error"></img>
                            </div>
                            <h2 className="collegeTitle">{this.props.data.name}</h2>
                            <div>{this.props.data.city}, {this.props.data.state}</div>
                        </div>                        
                    </div>
                        
                    <div className="collegeDetail">
                        <div className="collegeTypeRateWrap">
                            <div className="collegeTypeRate">{this.props.data.institution_type} Institution | {this.props.data.admission_rate} Acceptance Rate</div>
                        </div>
                        <div className="collegeDetailWrap">
                            <div className="collegeDetailText">
                                <div>Ranking: {this.props.data.ranking}</div>
                                <div>Cost: {this.props.data.cost}</div>
                                <div>Student Population: {this.props.data.population}</div>
                            </div>
                            <div className="collegeDetailRank">
                                <p className="collegeRecScore">5</p>
                            </div>
                        </div>    
                    </div>

                    <div className="moreInfo">
                        <div className="popoutLink">>> More info </div>
                    </div>
                    
                </div>
            </div>
            
        );
    }
}

export default CollegeResult;