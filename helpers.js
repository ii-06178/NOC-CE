
function map_point(P, Q, A, B, X){
    let alpha;
    if (typeof(P) == "number"){
        alpha =  (P-X)/(P-Q); //using the formula in the manual and making alpha subject of formula
    }
    else{ //if its a point then we take the x-coordinate for the alpha
        alpha =  (P[0]-X[0])/(P[0]-Q[0]);
    }
    
    let result = mix(A,B,alpha);//then we use the given mix function to give us the new X for A and B
    
    return result;
}

function map_point_quadratic(P, Q, R, A, B, C, X){ //this is the same function as above but....
    let result = [];
    
    for (let i=0; i< A.length; i++){
        result[i] = (X - Q)*(X - R)/(P - Q)/(P - R) * A[i] + 
                    (X - P)*(X - R)/(Q - P)/(Q - R) * B[i] +
                    (X - P)*(X - Q)/(R - P)/(R - Q) * C[i]
    }
    return result;
}