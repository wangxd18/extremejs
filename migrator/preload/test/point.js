function Point(){
    this.x=1;
    this.y=2;
}
Point.prototype.__type__ = 'Point';
function twoPoint(){
    this.p1 = new Point();
    this.p2 = new Point();
    this.p2.y *= 2;
    this.p2.name = 'point2';
}
twoPoint.prototype.__type__ = 'twoPoint';
