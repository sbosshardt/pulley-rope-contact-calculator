/**
 * Interactive Pulley/Rope Calculator
 * Physics simulation with drag interaction and real-time calculations
 */

class PulleyCalculator {
    constructor() {
        // Application state
        this.state = {
            tension: 10,
            theta1: 180,
            theta2: 270,
            wrapDirection: 'ccw',
            theta1Units: 'deg',
            theta2Units: 'deg',
            contactMode: 'tangential'
        };

        // Visualization constants
        this.pulleyCenter = { x: 200, y: 200 };
        this.pulleyRadius = 80;
        this.ropeExtension = 60; // Length of rope segments outside pulley
        
        // Drag state
        this.isDragging = false;
        this.dragTarget = null;

        this.initializeElements();
        this.bindEventListeners();
        this.updateAll();
    }

    initializeElements() {
        // Input elements
        this.elements = {
            tension: document.getElementById('tension'),
            tensionSlider: document.getElementById('tension-slider'),
            theta1: document.getElementById('theta1'),
            theta1Slider: document.getElementById('theta1-slider'),
            theta1Units: document.getElementById('theta1-units'),
            theta2: document.getElementById('theta2'),
            theta2Slider: document.getElementById('theta2-slider'),
            theta2Units: document.getElementById('theta2-units'),
            wrapDirection: document.getElementById('wrap-direction'),
            contactMode: document.getElementById('contact-mode'),

            // SVG elements
            svg: document.getElementById('visualization'),
            pulley: document.getElementById('pulley'),
            ropeArc: document.getElementById('rope-arc'),
            ropeSegment1: document.getElementById('rope-segment1'),
            ropeSegment2: document.getElementById('rope-segment2'),
            contactPoint1: document.getElementById('contact-point1'),
            contactPoint2: document.getElementById('contact-point2'),
            force1Vector: document.getElementById('force1-vector'),
            force2Vector: document.getElementById('force2-vector'),
            axleForceVector: document.getElementById('axle-force-vector'),

            // Labels
            slope1Label: document.getElementById('slope1-label'),
            slope2Label: document.getElementById('slope2-label'),
            contactAngleLabel: document.getElementById('contact-angle-label'),

            // Results
            slope1Result: document.getElementById('slope1-result'),
            slope2Result: document.getElementById('slope2-result'),
            force1Result: document.getElementById('force1-result'),
            force2Result: document.getElementById('force2-result'),
            axleForceResult: document.getElementById('axle-force-result'),
            axleMagnitudeResult: document.getElementById('axle-magnitude-result'),
            axleAngleResult: document.getElementById('axle-angle-result'),
            contactAngleRadResult: document.getElementById('contact-angle-rad-result'),
            contactAngleDegResult: document.getElementById('contact-angle-deg-result')
        };
    }

    bindEventListeners() {
        // Input synchronization
        this.elements.tension.addEventListener('input', () => {
            this.state.tension = parseFloat(this.elements.tension.value) || 0;
            this.elements.tensionSlider.value = this.state.tension;
            this.updateAll();
        });

        this.elements.tensionSlider.addEventListener('input', () => {
            this.state.tension = parseFloat(this.elements.tensionSlider.value);
            this.elements.tension.value = this.state.tension;
            this.updateAll();
        });

        this.elements.theta1.addEventListener('input', () => {
            this.state.theta1 = parseFloat(this.elements.theta1.value) || 0;
            this.syncSliderFromAngle('theta1');
            this.updateAll();
        });

        this.elements.theta1Slider.addEventListener('input', () => {
            const sliderValue = parseFloat(this.elements.theta1Slider.value);
            this.state.theta1 = this.fromRadians(this.toRadians(sliderValue, 'deg'), this.state.theta1Units);
            this.elements.theta1.value = this.formatNumber(this.state.theta1);
            this.updateAll();
        });

        this.elements.theta1Units.addEventListener('change', () => {
            const oldRadians = this.toRadians(this.state.theta1, this.state.theta1Units);
            this.state.theta1Units = this.elements.theta1Units.value;
            this.state.theta1 = this.fromRadians(oldRadians, this.state.theta1Units);
            this.elements.theta1.value = this.formatNumber(this.state.theta1);
            this.syncSliderFromAngle('theta1');
            this.updateAll();
        });

        this.elements.theta2.addEventListener('input', () => {
            this.state.theta2 = parseFloat(this.elements.theta2.value) || 0;
            this.syncSliderFromAngle('theta2');
            this.updateAll();
        });

        this.elements.theta2Slider.addEventListener('input', () => {
            const sliderValue = parseFloat(this.elements.theta2Slider.value);
            this.state.theta2 = this.fromRadians(this.toRadians(sliderValue, 'deg'), this.state.theta2Units);
            this.elements.theta2.value = this.formatNumber(this.state.theta2);
            this.updateAll();
        });

        this.elements.theta2Units.addEventListener('change', () => {
            const oldRadians = this.toRadians(this.state.theta2, this.state.theta2Units);
            this.state.theta2Units = this.elements.theta2Units.value;
            this.state.theta2 = this.fromRadians(oldRadians, this.state.theta2Units);
            this.elements.theta2.value = this.formatNumber(this.state.theta2);
            this.syncSliderFromAngle('theta2');
            this.updateAll();
        });

        this.elements.wrapDirection.addEventListener('change', () => {
            this.state.wrapDirection = this.elements.wrapDirection.value;
            this.updateAll();
        });

        this.elements.contactMode.addEventListener('change', () => {
            this.state.contactMode = this.elements.contactMode.value;
            this.updateAll();
        });

        // Drag interactions
        this.elements.contactPoint1.addEventListener('mousedown', (e) => this.startDrag(e, 'point1'));
        this.elements.contactPoint2.addEventListener('mousedown', (e) => this.startDrag(e, 'point2'));
        this.elements.contactPoint1.addEventListener('touchstart', (e) => this.startDrag(e, 'point1'));
        this.elements.contactPoint2.addEventListener('touchstart', (e) => this.startDrag(e, 'point2'));

        document.addEventListener('mousemove', (e) => this.handleDrag(e));
        document.addEventListener('touchmove', (e) => this.handleDrag(e));
        document.addEventListener('mouseup', () => this.endDrag());
        document.addEventListener('touchend', () => this.endDrag());

        // Window resize
        window.addEventListener('resize', () => this.updateVisualization());
    }

    // Unit conversion utilities
    toRadians(value, unit) {
        switch (unit) {
            case 'deg': return value * Math.PI / 180;
            case 'rad': return value;
            case 'pi': return value * Math.PI;
            default: return value;
        }
    }

    fromRadians(radians, unit) {
        switch (unit) {
            case 'deg': return radians * 180 / Math.PI;
            case 'rad': return radians;
            case 'pi': return radians / Math.PI;
            default: return radians;
        }
    }

    // Angle normalization utilities
    normalizeAngle(radians) {
        // Normalize to [0, 2π)
        while (radians < 0) radians += 2 * Math.PI;
        while (radians >= 2 * Math.PI) radians -= 2 * Math.PI;
        return radians;
    }

    // Number formatting utility
    formatNumber(value) {
        if (Math.abs(value) < 1e-10) return '0';
        return parseFloat(value.toFixed(4)).toString();
    }

    // Sync slider with angle input
    syncSliderFromAngle(angleKey) {
        const radians = this.toRadians(this.state[angleKey], this.state[angleKey + 'Units']);
        const degrees = radians * 180 / Math.PI;
        this.elements[angleKey + 'Slider'].value = degrees;
    }

    // Physics calculations
    calculateSlope(angleRadians, contactMode = 'perpendicular', isStartPoint = true) {
        let effectiveAngle = angleRadians;
        
        if (contactMode === 'tangential') {
            // For tangential contact, segments extend in opposite tangential directions
            if (this.state.wrapDirection === 'ccw') {
                effectiveAngle = angleRadians + (isStartPoint ? -Math.PI / 2 : Math.PI / 2);
            } else {
                effectiveAngle = angleRadians + (isStartPoint ? Math.PI / 2 : -Math.PI / 2);
            }
        }
        
        const cosTheta = Math.cos(effectiveAngle);
        if (Math.abs(cosTheta) < 1e-10) {
            return 'undefined';
        }
        return Math.tan(effectiveAngle);
    }

    calculateForce(tension, angleRadians, contactMode = 'perpendicular', isStartPoint = true) {
        let ropeDirection = angleRadians; // Direction rope extends
        
        if (contactMode === 'tangential') {
            // Calculate rope extension direction
            if (this.state.wrapDirection === 'ccw') {
                ropeDirection = angleRadians + (isStartPoint ? -Math.PI / 2 : Math.PI / 2);
            } else {
                ropeDirection = angleRadians + (isStartPoint ? Math.PI / 2 : -Math.PI / 2);
            }
        }
        
        // Force rope imparts (same direction as rope extension - rope pulls in this direction)
        const forceDirection = ropeDirection;
        
        return {
            x: tension * Math.cos(forceDirection),
            y: tension * Math.sin(forceDirection) // Use standard mathematical convention
        };
    }

    calculateContactAngle(theta1Rad, theta2Rad, wrapDirection) {
        let deltaTheta;
        if (wrapDirection === 'ccw') {
            deltaTheta = theta2Rad - theta1Rad;
        } else {
            deltaTheta = theta1Rad - theta2Rad;
        }
        
        // Normalize to [0, 2π)
        while (deltaTheta < 0) deltaTheta += 2 * Math.PI;
        while (deltaTheta >= 2 * Math.PI) deltaTheta -= 2 * Math.PI;
        
        return deltaTheta;
    }

    // Coordinate conversion (standard mathematical convention: 0° = right, 90° = up, CCW+)
    polarToCartesian(centerX, centerY, radius, angleRadians) {
        return {
            x: centerX + radius * Math.cos(angleRadians),
            y: centerY - radius * Math.sin(angleRadians) // Negative because SVG y increases downward
        };
    }

    // Calculate rope segment end point based on contact mode
    calculateRopeSegmentEnd(contactAngle, contactMode, isStartPoint = true) {
        const contactPoint = this.polarToCartesian(
            this.pulleyCenter.x, this.pulleyCenter.y, this.pulleyRadius, contactAngle
        );

        let segmentAngle = contactAngle;
        if (contactMode === 'tangential') {
            // For tangential contact, rope segments extend tangent to the circle
            // Both segments should extend AWAY from the wrapped portion
            if (this.state.wrapDirection === 'ccw') {
                segmentAngle = contactAngle + (isStartPoint ? -Math.PI / 2 : Math.PI / 2);
            } else {
                segmentAngle = contactAngle + (isStartPoint ? Math.PI / 2 : -Math.PI / 2);
            }
        }
        // For perpendicular mode, rope extends radially outward (segmentAngle = contactAngle)

        // Calculate segment end point extending outward from contact point
        const segmentEnd = {
            x: contactPoint.x + this.ropeExtension * Math.cos(segmentAngle),
            y: contactPoint.y - this.ropeExtension * Math.sin(segmentAngle) // Negative for SVG coordinate system
        };

        return { contactPoint, segmentEnd };
    }

    cartesianToPolar(centerX, centerY, x, y) {
        const dx = x - centerX;
        const dy = centerY - y; // Flip y because SVG y increases downward
        return {
            radius: Math.sqrt(dx * dx + dy * dy),
            angle: Math.atan2(dy, dx) // Standard mathematical convention
        };
    }

    // Drag handling
    startDrag(event, target) {
        event.preventDefault();
        this.isDragging = true;
        this.dragTarget = target;
        this.elements.svg.classList.add('dragging');
        document.body.style.userSelect = 'none';
    }

    handleDrag(event) {
        if (!this.isDragging || !this.dragTarget) return;

        event.preventDefault();
        const rect = this.elements.svg.getBoundingClientRect();
        const clientX = event.clientX || (event.touches && event.touches[0].clientX);
        const clientY = event.clientY || (event.touches && event.touches[0].clientY);
        
        const svgX = (clientX - rect.left) * (400 / rect.width);
        const svgY = (clientY - rect.top) * (400 / rect.height);

        const polar = this.cartesianToPolar(this.pulleyCenter.x, this.pulleyCenter.y, svgX, svgY);
        
        if (this.dragTarget === 'point1') {
            this.state.theta1 = this.fromRadians(polar.angle, this.state.theta1Units);
            this.elements.theta1.value = this.formatNumber(this.state.theta1);
            this.syncSliderFromAngle('theta1');
        } else if (this.dragTarget === 'point2') {
            this.state.theta2 = this.fromRadians(polar.angle, this.state.theta2Units);
            this.elements.theta2.value = this.formatNumber(this.state.theta2);
            this.syncSliderFromAngle('theta2');
        }

        this.updateAll();
    }

    endDrag() {
        this.isDragging = false;
        this.dragTarget = null;
        this.elements.svg.classList.remove('dragging');
        document.body.style.userSelect = '';
    }

    // Main update function
    updateAll() {
        this.updateCalculations();
        this.updateVisualization();
        this.updateResults();
    }

    updateCalculations() {
        // Convert angles to radians
        const theta1Rad = this.toRadians(this.state.theta1, this.state.theta1Units);
        const theta2Rad = this.toRadians(this.state.theta2, this.state.theta2Units);

        // Calculate slopes and forces based on contact mode
        this.calculations = {
            theta1Rad,
            theta2Rad,
            slope1: this.calculateSlope(theta1Rad, this.state.contactMode, true),  // point1 is start point
            slope2: this.calculateSlope(theta2Rad, this.state.contactMode, false), // point2 is end point
            force1: this.calculateForce(this.state.tension, theta1Rad, this.state.contactMode, true),  // point1 is start point
            force2: this.calculateForce(this.state.tension, theta2Rad, this.state.contactMode, false), // point2 is end point
            contactAngle: this.calculateContactAngle(theta1Rad, theta2Rad, this.state.wrapDirection)
        };

        // Calculate axle force (sum of forces rope exerts on pulley)
        this.calculations.axleForce = {
            x: this.calculations.force1.x + this.calculations.force2.x,
            y: this.calculations.force1.y + this.calculations.force2.y
        };

        this.calculations.axleForceMagnitude = Math.sqrt(
            this.calculations.axleForce.x ** 2 + this.calculations.axleForce.y ** 2
        );

        // Calculate angle of force rope imparts on pulley
        this.calculations.axleForceAngle = Math.atan2(
            this.calculations.axleForce.y, 
            this.calculations.axleForce.x
        ) * 180 / Math.PI;
    }

    updateVisualization() {
        const { theta1Rad, theta2Rad, contactAngle } = this.calculations;

        // Calculate rope segments based on contact mode
        const segment1 = this.calculateRopeSegmentEnd(theta1Rad, this.state.contactMode, true);  // point1 is start point
        const segment2 = this.calculateRopeSegmentEnd(theta2Rad, this.state.contactMode, false); // point2 is end point

        // Position contact points
        this.elements.contactPoint1.setAttribute('cx', segment1.contactPoint.x);
        this.elements.contactPoint1.setAttribute('cy', segment1.contactPoint.y);
        this.elements.contactPoint2.setAttribute('cx', segment2.contactPoint.x);
        this.elements.contactPoint2.setAttribute('cy', segment2.contactPoint.y);

        // Draw rope segments
        this.elements.ropeSegment1.setAttribute('x1', segment1.contactPoint.x);
        this.elements.ropeSegment1.setAttribute('y1', segment1.contactPoint.y);
        this.elements.ropeSegment1.setAttribute('x2', segment1.segmentEnd.x);
        this.elements.ropeSegment1.setAttribute('y2', segment1.segmentEnd.y);

        this.elements.ropeSegment2.setAttribute('x1', segment2.contactPoint.x);
        this.elements.ropeSegment2.setAttribute('y1', segment2.contactPoint.y);
        this.elements.ropeSegment2.setAttribute('x2', segment2.segmentEnd.x);
        this.elements.ropeSegment2.setAttribute('y2', segment2.segmentEnd.y);

        // Draw rope arc
        this.drawRopeArc(theta1Rad, theta2Rad, contactAngle);

        // Draw force vectors
        this.drawForceVectors(segment1, segment2);

        // Update labels
        this.updateLabels(segment1, segment2);
    }

    drawRopeArc(theta1Rad, theta2Rad, contactAngle) {
        const point1 = this.polarToCartesian(
            this.pulleyCenter.x, this.pulleyCenter.y, this.pulleyRadius, theta1Rad
        );
        const point2 = this.polarToCartesian(
            this.pulleyCenter.x, this.pulleyCenter.y, this.pulleyRadius, theta2Rad
        );

        const largeArcFlag = contactAngle > Math.PI ? 1 : 0;
        // Since we flipped Y coordinates, we need to flip the sweep direction too
        const sweepFlag = this.state.wrapDirection === 'ccw' ? 0 : 1;

        const pathData = `M ${point1.x} ${point1.y} A ${this.pulleyRadius} ${this.pulleyRadius} 0 ${largeArcFlag} ${sweepFlag} ${point2.x} ${point2.y}`;
        this.elements.ropeArc.setAttribute('d', pathData);
    }

    drawForceVectors(segment1, segment2) {
        const scale = 3; // Scale factor for force vectors
        const { force1, force2, axleForce } = this.calculations;

        // Rope end vectors show tension (pulling against hands), axle shows force on pulley
        // Force 1 vector (rope tension, pulling against hand 1)
        this.elements.force1Vector.setAttribute('x1', segment1.segmentEnd.x);
        this.elements.force1Vector.setAttribute('y1', segment1.segmentEnd.y);
        this.elements.force1Vector.setAttribute('x2', segment1.segmentEnd.x - force1.x * scale);
        this.elements.force1Vector.setAttribute('y2', segment1.segmentEnd.y + force1.y * scale); // Flip Y for SVG

        // Force 2 vector (rope tension, pulling against hand 2)
        this.elements.force2Vector.setAttribute('x1', segment2.segmentEnd.x);
        this.elements.force2Vector.setAttribute('y1', segment2.segmentEnd.y);
        this.elements.force2Vector.setAttribute('x2', segment2.segmentEnd.x - force2.x * scale);
        this.elements.force2Vector.setAttribute('y2', segment2.segmentEnd.y + force2.y * scale); // Flip Y for SVG

        // Axle force vector (force rope imparts on pulley)
        this.elements.axleForceVector.setAttribute('x1', this.pulleyCenter.x);
        this.elements.axleForceVector.setAttribute('y1', this.pulleyCenter.y);
        this.elements.axleForceVector.setAttribute('x2', this.pulleyCenter.x + axleForce.x * scale);
        this.elements.axleForceVector.setAttribute('y2', this.pulleyCenter.y - axleForce.y * scale); // Flip Y for SVG
    }

    updateLabels(segment1, segment2) {
        // Slope labels
        const slope1Text = this.calculations.slope1 === 'undefined' ? 
            'undefined' : this.formatNumber(this.calculations.slope1);
        const slope2Text = this.calculations.slope2 === 'undefined' ? 
            'undefined' : this.formatNumber(this.calculations.slope2);

        this.elements.slope1Label.setAttribute('x', (segment1.contactPoint.x + segment1.segmentEnd.x) / 2);
        this.elements.slope1Label.setAttribute('y', (segment1.contactPoint.y + segment1.segmentEnd.y) / 2 - 10);
        this.elements.slope1Label.textContent = `m₁=${slope1Text}`;

        this.elements.slope2Label.setAttribute('x', (segment2.contactPoint.x + segment2.segmentEnd.x) / 2);
        this.elements.slope2Label.setAttribute('y', (segment2.contactPoint.y + segment2.segmentEnd.y) / 2 - 10);
        this.elements.slope2Label.textContent = `m₂=${slope2Text}`;

        // Contact angle label
        const midAngle = (this.calculations.theta1Rad + this.calculations.theta2Rad) / 2;
        const labelPos = this.polarToCartesian(
            this.pulleyCenter.x, this.pulleyCenter.y, this.pulleyRadius - 25, midAngle
        );
        this.elements.contactAngleLabel.setAttribute('x', labelPos.x);
        this.elements.contactAngleLabel.setAttribute('y', labelPos.y);
        this.elements.contactAngleLabel.textContent = `${this.formatNumber(this.calculations.contactAngle * 180 / Math.PI)}°`;
    }

    updateResults() {
        const { slope1, slope2, force1, force2, axleForce, axleForceMagnitude, axleForceAngle, contactAngle } = this.calculations;

        // Slopes
        this.elements.slope1Result.textContent = slope1 === 'undefined' ? 'undefined' : this.formatNumber(slope1);
        this.elements.slope2Result.textContent = slope2 === 'undefined' ? 'undefined' : this.formatNumber(slope2);

        // Forces (show rope tension - force pulling against hands)
        this.elements.force1Result.textContent = `(${this.formatNumber(-force1.x)}, ${this.formatNumber(-force1.y)}) N`;
        this.elements.force2Result.textContent = `(${this.formatNumber(-force2.x)}, ${this.formatNumber(-force2.y)}) N`;

        // Axle force
        this.elements.axleForceResult.textContent = `(${this.formatNumber(axleForce.x)}, ${this.formatNumber(axleForce.y)}) N`;
        this.elements.axleMagnitudeResult.textContent = `${this.formatNumber(axleForceMagnitude)} N`;
        this.elements.axleAngleResult.textContent = `${this.formatNumber(axleForceAngle)}°`;

        // Contact angle
        this.elements.contactAngleRadResult.textContent = `${this.formatNumber(contactAngle)} rad`;
        this.elements.contactAngleDegResult.textContent = `${this.formatNumber(contactAngle * 180 / Math.PI)}°`;
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PulleyCalculator();
});
