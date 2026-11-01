jest.mock('node:fs/promises', () => ({ readFile: jest.fn() }));
jest.mock('../../src/utils/ocr-plate-reader');
jest.mock('../../src/models/parking.model', () => ({
  pool: { getConnection: jest.fn() },
  findVehicleForScan: jest.fn(),
  insertScanToken: jest.fn(),
  lockSlot: jest.fn(),
  lockVehicle: jest.fn(),
  findOpenSessionForVehicle: jest.fn(),
  lockTicket: jest.fn(),
  findActiveTicketForVehicleSlot: jest.fn(),
  lockScanToken: jest.fn(),
  markScanTokenUsed: jest.fn(),
  insertOpenSession: jest.fn(),
  updateSlotState: jest.fn(),
  lockSession: jest.fn(),
  closeSession: jest.fn(),
  updateTicketStatus: jest.fn()
}));

const fs = require('node:fs/promises');
const ocrReader = require('../../src/utils/ocr-plate-reader');
const parkingModel = require('../../src/models/parking.model');
const parkingService = require('../../src/services/parking.service');

function connection() {
  return {
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn()
  };
}

describe('parking.service', () => {
  beforeEach(() => jest.clearAllMocks());

  test('normalizes OCR plate, finds vehicle and persists opaque scan token', async () => {
    const conn = connection();
    parkingModel.pool.getConnection.mockResolvedValue(conn);
    fs.readFile.mockResolvedValue(Buffer.from([0xff, 0xd8, 0xff, 0x00]));
    ocrReader.readPlate.mockResolvedValue('51f-123.45');
    parkingModel.findVehicleForScan.mockResolvedValue({
      id: 10,
      license_plate: '51F12345',
      vehicle_name: 'Honda City',
      brand: 'Honda',
      customer_name: 'Nguyễn Văn A',
      phone: '0901234567',
      slot_code: 'A-01'
    });

    const result = await parkingService.scanPlate({
      file: { path: 'plate.jpg', filename: '00000000-0000-0000-0000-000000000000.jpg', originalname: 'plate.jpg' },
      sessionId: 'session-id',
      userId: 2
    });

    expect(result).toMatchObject({ exists: true, licensePlate: '51F12345', vehicleId: 10, slotCode: 'A-01' });
    expect(result.scanToken).toHaveLength(64);
    expect(parkingModel.insertScanToken).toHaveBeenCalledWith(conn, expect.objectContaining({ vehicleId: 10, normalizedPlate: '51F12345' }));
  });

  test('checks slot before vehicle and creates an occupied session', async () => {
    const conn = connection();
    parkingModel.pool.getConnection.mockResolvedValue(conn);
    parkingModel.lockSlot.mockResolvedValue({ id: 3, slot_code: 'A-01', status: 'AVAILABLE', current_vehicle_id: null });
    parkingModel.lockVehicle.mockResolvedValue({ id: 10, license_plate: '51F12345', vehicle_type: 'CAR' });
    parkingModel.findOpenSessionForVehicle.mockResolvedValue(null);
    parkingModel.findActiveTicketForVehicleSlot.mockResolvedValue(null);
    parkingModel.insertOpenSession.mockResolvedValue(100);

    const result = await parkingService.checkIn({ vehicleId: 10, slotId: 3, sessionId: 'session', userId: 2 });
    expect(result).toMatchObject({ sessionId: 100, slotCode: 'A-01', ticketId: null });
    expect(parkingModel.lockSlot.mock.invocationCallOrder[0]).toBeLessThan(parkingModel.lockVehicle.mock.invocationCallOrder[0]);
    expect(parkingModel.updateSlotState).toHaveBeenCalledWith(conn, 3, 'OCCUPIED', 10);
    expect(conn.commit).toHaveBeenCalled();
  });

  test('rolls back when a vehicle already has an open session', async () => {
    const conn = connection();
    parkingModel.pool.getConnection.mockResolvedValue(conn);
    parkingModel.lockSlot.mockResolvedValue({ id: 3, slot_code: 'A-01', status: 'AVAILABLE', current_vehicle_id: null });
    parkingModel.lockVehicle.mockResolvedValue({ id: 10, license_plate: '51F12345', vehicle_type: 'CAR' });
    parkingModel.findOpenSessionForVehicle.mockResolvedValue({ id: 99 });

    await expect(parkingService.checkIn({ vehicleId: 10, slotId: 3, sessionId: 'session', userId: 2 })).rejects.toMatchObject({ statusCode: 409 });
    expect(conn.rollback).toHaveBeenCalled();
    expect(conn.commit).not.toHaveBeenCalled();
  });

  test('checks out a valid daily ticket at zero fee and frees the slot', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-24T12:00:00+07:00'));
    const conn = connection();
    parkingModel.pool.getConnection.mockResolvedValue(conn);
    parkingModel.lockSession.mockResolvedValue({
      id: 100,
      vehicle_id: 10,
      ticket_id: 25,
      slot_id: 3,
      slot_code: 'A-01',
      slot_status: 'OCCUPIED',
      current_vehicle_id: 10,
      vehicle_type: 'CAR',
      check_in_time: '2026-10-24 08:00:00',
      check_out_time: null
    });
    parkingModel.lockTicket.mockResolvedValue({ id: 25, status: 'ACTIVE', start_date: '2026-10-24', end_date: '2026-10-24', deleted_at: null });

    const result = await parkingService.checkOut({ sessionId: 100 });
    expect(result.fee).toBe('0.00');
    expect(parkingModel.closeSession).toHaveBeenCalledWith(conn, 100, expect.any(Date), 0);
    expect(parkingModel.updateSlotState).toHaveBeenCalledWith(conn, 3, 'AVAILABLE', null);
    expect(conn.commit).toHaveBeenCalled();
    jest.useRealTimers();
  });

  test('does not attach a DAILY ticket outside its valid date window', () => {
    expect(parkingService.ticketIsUsableForCheckIn({
      status: 'ACTIVE', deleted_at: null, start_date: '2026-10-24', end_date: '2026-10-24'
    }, new Date('2026-10-25T00:00:00+07:00'))).toBe(false);
    expect(parkingService.ticketIsUsableForCheckIn({
      status: 'ACTIVE', deleted_at: null, start_date: '2026-10-24', end_date: '2026-10-24'
    }, new Date('2026-10-24T23:59:59+07:00'))).toBe(true);
  });
});
