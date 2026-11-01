// src/services/notificationService.ts

import { db } from '../lib/supabase';

interface NotificationData {
  userId: string; // ID du destinataire (responsable technique)
  type: 'INSTALLATION_REPORT'; // Type de notification
  title: string;
  message: string;
  data: {
    installationId: string;
    clientNom: string;
    numeroInstallation: string;
    totalHeures: number;
    nombreMachines: number;
    dateDebut: string;
    dateFin: string;
  };
}

/**
 * Créer une notification dans la base de données
 * La notification sera visible dans l'app pour le responsable technique
 */
export async function createNotification(notificationData: NotificationData) {
  try {
    const notification = {
      userId: notificationData.userId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      data: notificationData.data,
      read: false, // Non lue par défaut
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Créer la notification dans Lumi
    const result = await db.notifications.create(notification);
    
    console.log('✅ Notification créée:', result);
    return result;

  } catch (error) {
    console.error('❌ Erreur création notification:', error);
    throw error;
  }
}

/**
 * Envoyer une notification de compte-rendu d'installation
 */
export async function sendInstallationReportNotification(params: {
  responsableTechniqueId: string;
  responsableTechniqueNom: string;
  installationId: string;
  clientNom: string;
  numeroInstallation: string;
  totalHeures: number;
  nombreMachines: number;
  dateDebut: string;
  dateFin: string;
}) {
  const formatHeures = (heures: number) => {
    const h = Math.floor(heures);
    const m = Math.round((heures - h) * 60);
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  };

  try {
    await createNotification({
      userId: params.responsableTechniqueId,
      type: 'INSTALLATION_REPORT',
      title: `📋 Installation clôturée - ${params.clientNom}`,
      message: `Le compte-rendu d'installation ${params.numeroInstallation} est disponible. Total: ${formatHeures(params.totalHeures)} sur ${params.nombreMachines} machine(s).`,
      data: {
        installationId: params.installationId,
        clientNom: params.clientNom,
        numeroInstallation: params.numeroInstallation,
        totalHeures: params.totalHeures,
        nombreMachines: params.nombreMachines,
        dateDebut: params.dateDebut,
        dateFin: params.dateFin
      }
    });

    console.log(`✅ Notification envoyée à ${params.responsableTechniqueNom}`);
    return true;

  } catch (error) {
    console.error('❌ Erreur envoi notification:', error);
    return false;
  }
}

/**
 * Récupérer les notifications d'un utilisateur
 */
export async function getUserNotifications(userId: string) {
  try {
    const result = await db.notifications.list({
      filter: { userId },
      sort: [{ field: 'createdAt', direction: 'desc' }],
      limit: 50
    });

    return result.list || [];
  } catch (error) {
    console.error('❌ Erreur récupération notifications:', error);
    return [];
  }
}

/**
 * Marquer une notification comme lue
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    await db.notifications.update(notificationId, {
      read: true,
      updatedAt: new Date().toISOString()
    });

    console.log('✅ Notification marquée comme lue');
    return true;
  } catch (error) {
    console.error('❌ Erreur marquage notification:', error);
    return false;
  }
}

/**
 * Supprimer une notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    await db.notifications.delete(notificationId);
    console.log('✅ Notification supprimée');
    return true;
  } catch (error) {
    console.error('❌ Erreur suppression notification:', error);
    return false;
  }
}

/**
 * Récupérer le nombre de notifications non lues
 */
export async function getUnreadNotificationsCount(userId: string) {
  try {
    const result = await db.notifications.list({
      filter: { userId, read: false },
      limit: 100
    });

    return result.list?.length || 0;
  } catch (error) {
    console.error('❌ Erreur comptage notifications:', error);
    return 0;
  }
}
