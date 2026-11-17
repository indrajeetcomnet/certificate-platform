import axiosClient from './axiosClient.js';

export const getAllTournaments = (institutionId) => {
  const url = institutionId ? `/tournaments?institutionId=${institutionId}` : '/tournaments';
  return axiosClient.get(url);
};

export const getTournamentById = (id) => {
  return axiosClient.get(`/tournaments/${id}`);
};

export const createTournament = (data) => {
  return axiosClient.post('/tournaments', data);
};

export const updateTournament = (id, data) => {
  return axiosClient.put(`/tournaments/${id}`, data);
};

export const deleteTournament = (id) => {
  return axiosClient.delete(`/tournaments/${id}`);
};

export const registerParticipant = (tournamentId, data) => {
  return axiosClient.post(`/tournaments/${tournamentId}/participants`, data);
};

export const updateParticipantStatus = (tournamentId, participantId, status) => {
  return axiosClient.put(`/tournaments/${tournamentId}/participants/${participantId}?status=${status}`);
};

export const createMatch = (tournamentId, data) => {
  return axiosClient.post(`/tournaments/${tournamentId}/matches`, data);
};

export const updateMatchScore = (tournamentId, matchId, data) => {
  return axiosClient.put(`/tournaments/${tournamentId}/matches/${matchId}/score`, data);
};

export const finalizeTournament = (tournamentId, data) => {
  return axiosClient.post(`/tournaments/${tournamentId}/finalize`, data);
};

export default {
  getAllTournaments,
  getTournamentById,
  createTournament,
  updateTournament,
  deleteTournament,
  registerParticipant,
  updateParticipantStatus,
  createMatch,
  updateMatchScore,
  finalizeTournament,
};
