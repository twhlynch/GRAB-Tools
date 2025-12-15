;
;  car.asm
;
;  creates a drivable car 'Car' using a steering wheel 'Str' and a holding trigger 'Hol'
;

; setup velocity variables

SET R0 0 ; speed X
SET R1 0 ; speed Z

LABEL LOOP

    SET R6 DeltaTime ; get once so its consistent if the loop is in between frames

    ; get angle of steering wheel for speed

    SET R2 Str.Rot.Y ; forward rotation adds speed

    LESS R7 R2 -5   ; R2 < -5
    GREATER R5 R2 5 ; R2 > 5
    OR R7 R7 R5     ; R2 < -5 || R2 > 5
    AND R7 R7 Hol.Act ; must also be holding the wheel
    IF R7 keep_speed
      SET R2 0      ; -5 to 5 becomes 0
    LABEL keep_speed

    ; steer the car based on the steering

    SET R3 Str.Rot.X ; steering rotation

    LESS R7 R3 -5   ; R3 < -5
    GREATER R5 R3 5 ; R3 > 5
    OR R7 R7 R5     ; R3 < -5 || R3 > 5
    AND R7 R7 Hol.Act ; must also be holding the wheel
    IF R7 keep_steer
      SET R3 0      ; -5 to 5 becomes 0
    LABEL keep_steer

    MUL R3 R3 R6    ; multiply by delta
    MUL R3 R3 0.1   ; turn speed constant

    ADD Car.Rot.Y Car.Rot.Y R3 ; turn the car

    ; calculate additional x and z speed from y angle and speed

    SET R3 Car.Rot.Y ; car rotation used for speed calculations

    COS R4 R3     ; R4 is new x speed
    SIN R5 R3     ; R5 is new z speed

    MUL R4 R4 R2  ; multiply x by speed from wheel angle
    MUL R5 R5 R2  ; and z

    MUL R4 R4 R6  ; multiply by delta
    MUL R5 R5 R6

    MUL R4 R4 0.1 ; speed constant
    MUL R5 R5 0.1

    ADD R0 R0 R4  ; add new speed to velocity
    ADD R1 R1 R5

    ; lost speed from friction
    ; multiply current speed by 1 - (delta * 0.2)

    MUL R7 R6 0.2 ; f = d * 0.2
    SUB R7 1 R7   ; f = 1 - (d * 0.2)
    MUL R0 R0 R7  ; x *= f
    MUL R1 R1 R7  ; z *= f

    ; limit top speeds 20 and -70

    ; limit x speed
    LESS R7 R0 20          ; R7 = R0 < 20
    IF R7 dont_cap_speed_x ; if !R7
      SET R0 20            ; R0 = 20
    LABEL dont_cap_speed_x

    GREATER R7 R0 -70           ; R7 = R0 < 20
    IF R7 dont_cap_speed_back_x ; if !R7
      SET R0 -70                ; R0 = -70
    LABEL dont_cap_speed_back_x

    ; limit z speed
    LESS R7 R1 20          ; R7 = R1 < 20
    IF R7 dont_cap_speed_z ; if !R7
      SET R1 20            ; R1 = 20
    LABEL dont_cap_speed_z

    GREATER R7 R1 -70           ; R7 = R1 < 20
    IF R7 dont_cap_speed_back_z ; if !R7
      SET R1 -70                ; R1 = -70
    LABEL dont_cap_speed_back_z

    ; move car with speed

    MUL R2 R0 R6 ; multiply by delta
    MUL R3 R1 R6

    ADD Car.Pos.X Car.Pos.X R2
    ADD Car.Pos.Z Car.Pos.Z R3

    ; only run once per frame

    SLEEP 0 ; sleeping for 0 will just prevent any more instructions running this frame

GOTO LOOP
