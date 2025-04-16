/*Measurement payload (port 16):

1000001800440BAA000000000000000000000000



Status payload (port 48):

300000010106360063006300040600181BAA
*/

function parseUplink(device, payload) {
    var payloadb = payload.asBytes();
    var decoded = Decoder(payloadb, payload.port)
    env.log(decoded);

    // Store battery
    if (decoded.data.bat_pct != null ) {
        device.updateDeviceBattery({ percentage : decoded.data.bat_pct });

    };


    // Store temperature
    if (decoded.data.temp_C != null) {
        var sensor1 = device.endpoints.byAddress("1");

        if (sensor1 != null)
            sensor1.updateTemperatureSensorStatus(decoded.data.temp_C);

    };
  // Store ullage
    if (decoded.data.ullage_cm != null) {
        var sensor2 = device.endpoints.byAddress("2");

        if (sensor2 != null)
            sensor2.updateGenericSensorStatus(decoded.data.ullage_cm);

    };
 // Store status
    if (decoded.active != null) {
        var sensor3 = device.endpoints.byAddress("3");

        if (sensor3 != null)
            sensor3.updateApplianceStatus(decoded.active);

    };
}


function Decoder(bytes, port) {
  let offset = 0;

  // --- Create input object with fPort property ---
  var input = {
    "fPort": port,
    "bytes": bytes
  };

  // --- measurement payload ---
  if (input.fPort == 16) {
    let ullage = (input.bytes[4] << 8) + input.bytes[5];
    let temp = input.bytes[6];

    if (temp > 50) {
      offset = 256;
    }

    let temperature = -(offset - temp);
    let src = input.bytes[7] >> 4;
    let srssi = input.bytes[7] & 0xF;

    return {
      data: {
        ullage_cm: ullage,
        temp_C: temperature,
        src: src,
        srssi: srssi,
      }
    };
  }

  // --- status payload ---
  else if (input.fPort == 48) {
    let ullage = (input.bytes[14] << 8) + input.bytes[15];
    let temp = input.bytes[16];

    if (temp > 50) {
      offset = 256;
    }

    let temperature = -(offset - temp);
    let hardware = input.bytes[3];
    let firmware = input.bytes[4].toString() + "." + input.bytes[5].toString();
    let reasonBytes = input.bytes[6];
    let contactReason = reasonBytes & 0x3;
    var contactReasonMsg = "";

    // ... (rest of your switch statements)

    let activeStatus = (reasonBytes >> 5) & 0x1;
    let battery = input.bytes[10];
    let txPeriod = input.bytes[13];
    let sensorRSSI = -input.bytes[8];

    var data = {
      ullage_cm: ullage,
      temp_C: temperature,
      firmware: firmware,
      contactReason: contactReasonMsg,
      active: activeStatus,
      bat_pct: battery,
      txPeriod_h: txPeriod,
      sensorRSSI_dBm: sensorRSSI,
      hw_id: hardware
    };

   

    return { data: data };
  }


}
